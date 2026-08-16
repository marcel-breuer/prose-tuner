import { resolveLanguage } from '../language/index.js';
import type { TextRange } from '../parser/index.js';
import type {
  AnalyzerThresholds,
  AnalyzeStyleOptions,
  StyleAnalysis,
  StyleFinding,
} from './types.js';

export const DEFAULT_ANALYZER_THRESHOLDS: AnalyzerThresholds = {
  fillerOccurrences: 2,
  headingDensityPer100Words: 3,
  longSentenceWords: 35,
  maximumParagraphWords: 150,
  metaPhraseOccurrences: 1,
  nominalStyleOccurrences: 3,
  repeatedPhraseOccurrences: 2,
  repeatedSentenceOpeningOccurrences: 2,
  sentenceMonotonyMinimum: 3,
  sentenceMonotonyTolerance: 3,
  transitionOccurrences: 3,
};

interface LocatedText {
  readonly range: TextRange;
  readonly value: string;
}

export function analyzeStyle(input: string, options: AnalyzeStyleOptions = {}): StyleAnalysis {
  const thresholds = { ...DEFAULT_ANALYZER_THRESHOLDS, ...options.thresholds };
  const language = resolveLanguage({
    ...(options.language === undefined ? {} : { language: options.language }),
    text: input,
  });
  const sentences = extractSentences(input);
  const findings: StyleFinding[] = [
    ...analyzeRepeatedPhrases(input, thresholds),
    ...analyzeSentenceOpenings(sentences, thresholds),
    ...analyzeSentenceLengths(sentences, thresholds),
    ...analyzeHeadingDensity(input, thresholds),
    ...analyzeParagraphs(input, thresholds),
  ];

  if (language.registry !== undefined) {
    findings.push(
      ...analyzeTermFrequency(
        input,
        language.registry.transitions,
        thresholds.transitionOccurrences,
        'transition',
        'Repeated transition phrase',
      ),
      ...analyzeTermFrequency(
        input,
        language.registry.metaPhrases,
        thresholds.metaPhraseOccurrences,
        'meta-commentary',
        'Formulaic meta-commentary phrase',
      ),
      ...analyzeTermFrequency(
        input,
        language.registry.fillerAndIntensifiers,
        thresholds.fillerOccurrences,
        'filler',
        'Repeated filler or intensifier',
      ),
      ...analyzeRedundancy(input, language.registry.heuristics.redundancyPairs),
    );

    if (language.registry.family === 'german') {
      findings.push(
        ...analyzeGermanNominalStyle(
          input,
          language.registry.heuristics.nominalizationSuffixes,
          thresholds,
        ),
      );
    }
  }

  return { findings: findings.sort(compareFindings), language, thresholds };
}

function analyzeRepeatedPhrases(
  input: string,
  thresholds: AnalyzerThresholds,
): readonly StyleFinding[] {
  const words = [...input.matchAll(/\p{L}+/gu)].map((match) => ({
    range: { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length },
    value: match[0].toLocaleLowerCase(),
  }));
  const phrases = new Map<string, LocatedText[]>();

  for (let index = 0; index <= words.length - 3; index += 1) {
    const sequence = words.slice(index, index + 3);
    const first = sequence[0];
    const last = sequence[2];
    if (first === undefined || last === undefined) {
      continue;
    }
    const phrase = sequence.map((word) => word.value).join(' ');
    const range = { start: first.range.start, end: last.range.end };
    phrases.set(phrase, [...(phrases.get(phrase) ?? []), { range, value: phrase }]);
  }

  return [...phrases.values()].flatMap((occurrences) => {
    if (occurrences.length < thresholds.repeatedPhraseOccurrences) {
      return [];
    }

    const first = occurrences[0];
    const repeated = occurrences[1] ?? first;
    if (first === undefined || repeated === undefined) {
      return [];
    }

    return [
      finding(
        'repeated-phrase',
        `Repeated phrase: “${first.value}”.`,
        occurrences.length,
        repeated.range,
      ),
    ];
  });
}

function analyzeSentenceOpenings(
  sentences: readonly LocatedText[],
  thresholds: AnalyzerThresholds,
): readonly StyleFinding[] {
  const openings = new Map<string, LocatedText[]>();

  for (const sentence of sentences) {
    const words = sentence.value.match(/\p{L}+/gu)?.slice(0, 3) ?? [];
    if (words.length < 2) {
      continue;
    }

    const opening = words.join(' ').toLocaleLowerCase();
    openings.set(opening, [...(openings.get(opening) ?? []), sentence]);
  }

  return [...openings.entries()].flatMap(([opening, occurrences]) => {
    const repeated = occurrences[1] ?? occurrences[0];
    return occurrences.length < thresholds.repeatedSentenceOpeningOccurrences ||
      repeated === undefined
      ? []
      : [
          finding(
            'repeated-sentence-opening',
            `Repeated sentence opening: “${opening}”.`,
            occurrences.length,
            repeated.range,
          ),
        ];
  });
}

function analyzeSentenceLengths(
  sentences: readonly LocatedText[],
  thresholds: AnalyzerThresholds,
): readonly StyleFinding[] {
  const lengths = sentences.map((sentence) => ({ ...sentence, words: countWords(sentence.value) }));
  const findings = lengths.flatMap((sentence) =>
    sentence.words > thresholds.longSentenceWords
      ? [
          finding(
            'sentence-length',
            `Long sentence with ${sentence.words} words.`,
            1,
            sentence.range,
          ),
        ]
      : [],
  );

  const lengthRange =
    lengths.length === 0
      ? 0
      : Math.max(...lengths.map((sentence) => sentence.words)) -
        Math.min(...lengths.map((sentence) => sentence.words));
  if (
    lengths.length >= thresholds.sentenceMonotonyMinimum &&
    lengthRange <= thresholds.sentenceMonotonyTolerance
  ) {
    const first = lengths[0];
    const last = lengths.at(-1) ?? first;
    if (first === undefined || last === undefined) {
      return findings;
    }
    findings.push(
      finding('sentence-monotony', 'Sentence lengths are unusually uniform.', lengths.length, {
        start: first.range.start,
        end: last.range.end,
      }),
    );
  }

  return findings;
}

function analyzeHeadingDensity(
  input: string,
  thresholds: AnalyzerThresholds,
): readonly StyleFinding[] {
  const headings = [...input.matchAll(/^ {0,3}#{1,6}\s+.+$/gm)];
  const words = countWords(input);
  const density = words === 0 ? 0 : (headings.length / words) * 100;

  const firstHeading = headings[0];
  return density > thresholds.headingDensityPer100Words && firstHeading !== undefined
    ? [
        finding(
          'heading-density',
          `Heading density is ${density.toFixed(1)} per 100 words.`,
          headings.length,
          rangeOf(firstHeading),
        ),
      ]
    : [];
}

function analyzeParagraphs(input: string, thresholds: AnalyzerThresholds): readonly StyleFinding[] {
  return input.split(/(?:\r?\n){2,}/).flatMap((paragraph, index, paragraphs) => {
    const words = countWords(paragraph);
    if (words <= thresholds.maximumParagraphWords) {
      return [];
    }

    const start = paragraphs.slice(0, index).join('\n\n').length + (index === 0 ? 0 : 2);
    return [
      finding('paragraph-length', `Paragraph has ${words} words.`, 1, {
        start,
        end: start + paragraph.length,
      }),
    ];
  });
}

function analyzeTermFrequency(
  input: string,
  terms: readonly string[],
  threshold: number,
  category: StyleFinding['category'],
  message: string,
): readonly StyleFinding[] {
  return terms.flatMap((term) => {
    const matches = findTermMatches(input, term);
    const first = matches[0];
    return matches.length >= threshold
      ? [finding(category, `${message}: “${term}”.`, matches.length, first?.range)]
      : [];
  });
}

function analyzeGermanNominalStyle(
  input: string,
  suffixes: readonly string[],
  thresholds: AnalyzerThresholds,
): readonly StyleFinding[] {
  const pattern = new RegExp(`\\p{L}+(?:${suffixes.map(escapeRegExp).join('|')})\\b`, 'giu');
  const matches = [...input.matchAll(pattern)];
  const first = matches[0];
  return matches.length >= thresholds.nominalStyleOccurrences && first !== undefined
    ? [
        finding(
          'nominal-style',
          'Several German nominalizations may make the text abstract.',
          matches.length,
          rangeOf(first),
        ),
      ]
    : [];
}

function analyzeRedundancy(
  input: string,
  pairs: readonly (readonly [string, string])[],
): readonly StyleFinding[] {
  return pairs.flatMap(([first, second]) => {
    const match = new RegExp(`\\b${escapeRegExp(first)}\\s+${escapeRegExp(second)}\\b`, 'i').exec(
      input,
    );
    return match === null
      ? []
      : [
          finding(
            'lexical-redundancy',
            `Potentially redundant phrase: “${match[0]}”.`,
            1,
            rangeOf(match),
          ),
        ];
  });
}

function extractSentences(input: string): readonly LocatedText[] {
  const sentences: LocatedText[] = [];
  const pattern = /[^.!?\r\n]+[.!?]+|[^.!?\r\n]+$/gm;

  for (const match of input.matchAll(pattern)) {
    const value = match[0].trim();
    const rawStart = match.index ?? 0;
    const start = rawStart + match[0].indexOf(value);
    if (value.length > 0) {
      sentences.push({ range: { start, end: start + value.length }, value });
    }
  }

  return sentences;
}

function findTermMatches(input: string, term: string): readonly LocatedText[] {
  const pattern = new RegExp(`(?<!\\p{L})${escapeRegExp(term)}(?!\\p{L})`, 'giu');
  return [...input.matchAll(pattern)].map((match) => ({ range: rangeOf(match), value: match[0] }));
}

function countWords(input: string): number {
  return input.match(/\p{L}+/gu)?.length ?? 0;
}

function rangeOf(match: RegExpMatchArray | RegExpExecArray): TextRange {
  const start = match.index ?? 0;
  return { start, end: start + match[0].length };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function finding(
  category: StyleFinding['category'],
  message: string,
  occurrences: number,
  range: TextRange | undefined,
): StyleFinding {
  return {
    category,
    message,
    occurrences,
    range,
    severity: category === 'sentence-monotony' ? 'info' : 'warning',
  };
}

function compareFindings(left: StyleFinding, right: StyleFinding): number {
  return (
    (left.range?.start ?? Number.MAX_SAFE_INTEGER) -
      (right.range?.start ?? Number.MAX_SAFE_INTEGER) || left.category.localeCompare(right.category)
  );
}
