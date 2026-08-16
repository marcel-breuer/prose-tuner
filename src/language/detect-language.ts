import { getRuleRegistry } from './rules.js';
import type {
  EnglishLanguage,
  LanguageDetection,
  LanguageResolution,
  LanguageScores,
  ResolveLanguageOptions,
} from './types.js';

const GERMAN_MARKERS = new Set([
  'aber',
  'auch',
  'das',
  'dem',
  'den',
  'der',
  'des',
  'die',
  'ein',
  'eine',
  'er',
  'für',
  'ist',
  'mit',
  'nicht',
  'und',
  'von',
  'wird',
  'zu',
]);

const ENGLISH_MARKERS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'for',
  'is',
  'it',
  'of',
  'that',
  'the',
  'this',
  'to',
  'very',
  'was',
  'with',
]);

const EMPTY_SCORES: LanguageScores = { english: 0, german: 0 };

export function detectLanguage(
  text: string,
  englishVariant: EnglishLanguage = 'en-US',
): LanguageDetection {
  const tokens = text.toLocaleLowerCase().match(/\p{L}+/gu) ?? [];
  const scores = tokens.reduce<LanguageScores>(
    (current, token) => ({
      english: current.english + Number(ENGLISH_MARKERS.has(token)),
      german: current.german + Number(GERMAN_MARKERS.has(token)),
    }),
    EMPTY_SCORES,
  );

  if (scores.german >= 2 && scores.german > scores.english) {
    return { confidence: 'high', language: 'de-DE', scores };
  }

  if (scores.english >= 2 && scores.english > scores.german) {
    return { confidence: 'high', language: englishVariant, scores };
  }

  return { confidence: 'low', language: undefined, scores };
}

export function resolveLanguage(options: ResolveLanguageOptions): LanguageResolution {
  const languagePreference = options.language ?? 'auto';
  const detection = detectLanguage(options.text, options.englishVariant);

  if (languagePreference !== 'auto') {
    return {
      confidence: 'high',
      language: languagePreference,
      registry: getRuleRegistry(languagePreference),
      scores: detection.scores,
      source: 'explicit',
    };
  }

  if (detection.language === undefined) {
    return {
      confidence: detection.confidence,
      language: undefined,
      registry: undefined,
      scores: detection.scores,
      source: 'ambiguous',
    };
  }

  return {
    confidence: detection.confidence,
    language: detection.language,
    registry: getRuleRegistry(detection.language),
    scores: detection.scores,
    source: 'detected',
  };
}
