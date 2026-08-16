import type {
  DocumentSegment,
  InputFormat,
  ParseDocumentOptions,
  ProtectedContentKind,
  ProtectedSegment,
  StructureSegment,
  TextRange,
} from './types.js';

interface Candidate {
  readonly kind: 'protected' | 'structure';
  readonly protectedKind?: ProtectedContentKind;
  readonly range: TextRange;
  readonly value: string;
}

const FENCED_CODE_BLOCK =
  /^(?: {0,3})(`{3,}|~{3,})[^\r\n]*(?:\r?\n|$)[\s\S]*?^(?: {0,3})\1[^\r\n]*(?=\r?$|\n)/gm;
const INLINE_CODE = /(?<!\\)(`+)[^`\r\n]*\1/g;
const MARKDOWN_LINK = /!?\[[^\]\r\n]*]\((?:\\.|[^)\r\n])*\)/g;
const DIRECT_QUOTE = /„(?:\\.|[^„“\\\r\n])+“|"(?:\\.|[^"\\\r\n])+"/g;
const URL = /https?:\/\/[^\s<>"'`]+/gi;
const DOI = /\b(?:doi:\s*)?10\.\d{4,9}\/[\w.()/:;-]+/gi;
const ISBN = /\b(?:ISBN(?:-1[03])?:?\s*)?(?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dX]\b/gi;
const INLINE_CITATION =
  /\([A-ZÄÖÜ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+,\s*(?:19|20)\d{2}(?:,\s*(?:S\.|p\.)\s*\d+(?:[-–]\d+)?)?\)/g;
const FOOTNOTE_REFERENCE = /\[\^[^\]\r\n]+]/g;
const MARKDOWN_STRUCTURE = /^(?: {0,3})(?:#{1,6}[\t ]+|(?:[-+*]|\d+[.)])[\t ]+)/gm;

/**
 * Parses text into immutable protected/structural segments and editable prose.
 * The parser is intentionally lossless: joining the segment values recreates
 * the original input exactly.
 */
export function parseDocument(input: string, options: ParseDocumentOptions = {}) {
  const format = options.format ?? detectInputFormat(input);
  const preserveStructure = options.preserveStructure ?? true;
  const candidates = collectCandidates(input, format, preserveStructure);

  return {
    format,
    preserveStructure,
    source: input,
    segments: createSegments(input, candidates),
  } as const;
}

export function detectInputFormat(input: string): InputFormat {
  return /^(?: {0,3})(?:#{1,6}\s|[-+*]\s|\d+[.)]\s|`{3,}|~{3,})|!?\[[^\]]*]\([^)]*\)|`[^`]+`/m.test(
    input,
  )
    ? 'markdown'
    : 'plain-text';
}

function collectCandidates(
  input: string,
  format: InputFormat,
  preserveStructure: boolean,
): readonly Candidate[] {
  const candidates: Candidate[] = [];

  if (format === 'markdown') {
    addMatches(candidates, input, FENCED_CODE_BLOCK, 'protected', 'fenced-code-block');
    addMatches(candidates, input, INLINE_CODE, 'protected', 'inline-code');
    addMatches(candidates, input, MARKDOWN_LINK, 'protected', 'markdown-link');

    if (preserveStructure) {
      addMatches(candidates, input, MARKDOWN_STRUCTURE, 'structure');
    }
  }

  addMatches(candidates, input, DIRECT_QUOTE, 'protected', 'direct-quote');
  addMatches(candidates, input, URL, 'protected', 'url');
  addMatches(candidates, input, DOI, 'protected', 'doi');
  addMatches(candidates, input, ISBN, 'protected', 'isbn');
  addMatches(candidates, input, INLINE_CITATION, 'protected', 'citation');
  addMatches(candidates, input, FOOTNOTE_REFERENCE, 'protected', 'footnote-reference');

  return selectNonOverlappingCandidates(candidates);
}

function addMatches(
  candidates: Candidate[],
  input: string,
  pattern: RegExp,
  kind: Candidate['kind'],
  protectedKind?: ProtectedContentKind,
): void {
  for (const match of input.matchAll(pattern)) {
    const value = match[0];
    const start = match.index;

    if (start === undefined || value.length === 0) {
      continue;
    }

    candidates.push({
      kind,
      ...(protectedKind === undefined ? {} : { protectedKind }),
      range: { start, end: start + value.length },
      value,
    });
  }
}

function selectNonOverlappingCandidates(candidates: readonly Candidate[]): readonly Candidate[] {
  const selected: Candidate[] = [];

  for (const candidate of [...candidates].sort(compareCandidatePriority)) {
    if (selected.every((current) => !rangesOverlap(current.range, candidate.range))) {
      selected.push(candidate);
    }
  }

  return selected.sort((left, right) => left.range.start - right.range.start);
}

function compareCandidatePriority(left: Candidate, right: Candidate): number {
  const priority = (candidate: Candidate): number => {
    if (candidate.protectedKind === 'fenced-code-block') {
      return 0;
    }

    if (candidate.protectedKind === 'markdown-link') {
      return 1;
    }

    if (candidate.kind === 'protected') {
      return 2;
    }

    return 3;
  };

  return priority(left) - priority(right) || left.range.start - right.range.start;
}

function rangesOverlap(left: TextRange, right: TextRange): boolean {
  return left.start < right.end && right.start < left.end;
}

function createSegments(
  input: string,
  candidates: readonly Candidate[],
): readonly DocumentSegment[] {
  const segments: DocumentSegment[] = [];
  let cursor = 0;

  for (const candidate of candidates) {
    if (cursor < candidate.range.start) {
      segments.push({
        kind: 'editable',
        range: { start: cursor, end: candidate.range.start },
        value: input.slice(cursor, candidate.range.start),
      });
    }

    segments.push(createProtectedOrStructureSegment(candidate));
    cursor = candidate.range.end;
  }

  if (cursor < input.length || segments.length === 0) {
    segments.push({
      kind: 'editable',
      range: { start: cursor, end: input.length },
      value: input.slice(cursor),
    });
  }

  return segments;
}

function createProtectedOrStructureSegment(
  candidate: Candidate,
): ProtectedSegment | StructureSegment {
  if (candidate.kind === 'structure') {
    return {
      kind: 'structure',
      range: candidate.range,
      value: candidate.value,
    };
  }

  if (candidate.protectedKind === undefined) {
    throw new Error('Protected parser candidates require a content kind.');
  }

  return {
    kind: 'protected',
    protectedKind: candidate.protectedKind,
    range: candidate.range,
    value: candidate.value,
  };
}
