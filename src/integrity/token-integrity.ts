import type {
  IntegrityFailure,
  IntegrityOptions,
  IntegrityToken,
  IntegrityTokenCategory,
  IntegrityValidationResult,
  ProtectedTerm,
} from './types.js';

const PATTERNS: readonly [IntegrityTokenCategory, RegExp][] = [
  ['direct-quote', /„(?:\\.|[^„“\\\r\n])+“|“(?:\\.|[^“”\\\r\n])+”|"(?:\\.|[^"\\\r\n])+"/g],
  ['url', /https?:\/\/[^\s<>"'`]+/gi],
  ['doi', /\b(?:doi:\s*)?10\.\d{4,9}\/[\w.()/:;-]+/gi],
  [
    'citation',
    /\([A-ZÄÖÜ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+,\s*(?:19|20)\d{2}(?:,\s*(?:S\.|p\.)\s*\d+(?:[-–]\d+)?)?\)/g,
  ],
  ['date', /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g],
  ['percentage', /\b\d+(?:[.,]\d+)?\s*%/g],
  ['currency', /\b\d+(?:[.,]\d+)*(?:\s*[€$£])/g],
  ['number', /\b\d+(?:[.,]\d+)*\b/g],
];

export function extractIntegrityTokens(
  input: string,
  options: IntegrityOptions = {},
): readonly IntegrityToken[] {
  const candidates: IntegrityToken[] = [];
  for (const [category, pattern] of PATTERNS) {
    for (const match of input.matchAll(pattern)) {
      const start = match.index;
      if (start !== undefined)
        candidates.push({
          category,
          caseSensitive: true,
          range: { start, end: start + match[0].length },
          value: match[0],
        });
    }
  }
  for (const term of options.protectedTerms ?? []) addProtectedTermMatches(candidates, input, term);
  return selectNonOverlapping(candidates);
}

export function validateTokenIntegrity(
  original: string,
  rewritten: string,
  options: IntegrityOptions = {},
): IntegrityValidationResult {
  const expected = countTokens(extractIntegrityTokens(original, options));
  const actual = countTokens(extractIntegrityTokens(rewritten, options));
  const failures: IntegrityFailure[] = [];
  for (const [key, token] of expected) {
    const actualCount = actual.get(key)?.count ?? 0;
    for (let index = actualCount; index < token.count; index += 1)
      failures.push({ category: token.category, reason: 'missing', token: token.value });
  }
  for (const [key, token] of actual) {
    const expectedCount = expected.get(key)?.count ?? 0;
    for (let index = expectedCount; index < token.count; index += 1)
      failures.push({ category: token.category, reason: 'unexpected', token: token.value });
  }
  return { failures, status: failures.length === 0 ? 'passed' : 'failed' };
}

function addProtectedTermMatches(
  tokens: IntegrityToken[],
  input: string,
  term: ProtectedTerm,
): void {
  const caseSensitive = term.caseSensitive ?? true;
  const pattern = new RegExp(
    `(?<!\\p{L})${escapeRegExp(term.value)}(?!\\p{L})`,
    `g${caseSensitive ? '' : 'i'}u`,
  );
  for (const match of input.matchAll(pattern)) {
    const start = match.index;
    if (start !== undefined)
      tokens.push({
        category: 'protected-term',
        caseSensitive,
        range: { start, end: start + match[0].length },
        value: match[0],
      });
  }
}

function selectNonOverlapping(tokens: readonly IntegrityToken[]): readonly IntegrityToken[] {
  const selected: IntegrityToken[] = [];
  for (const token of [...tokens].sort(
    (left, right) =>
      left.range.start - right.range.start || priority(left.category) - priority(right.category),
  )) {
    if (
      selected.every(
        (current) =>
          current.range.start >= token.range.end || token.range.start >= current.range.end,
      )
    )
      selected.push(token);
  }
  return selected;
}

function priority(category: IntegrityTokenCategory): number {
  return category === 'direct-quote' ||
    category === 'url' ||
    category === 'doi' ||
    category === 'citation'
    ? 0
    : category === 'date' || category === 'percentage' || category === 'currency'
      ? 1
      : 2;
}
function countTokens(
  tokens: readonly IntegrityToken[],
): Map<string, IntegrityToken & { count: number }> {
  const counts = new Map<string, IntegrityToken & { count: number }>();
  for (const token of tokens) {
    const key = `${token.category}\u0000${token.caseSensitive ? token.value : token.value.toLocaleLowerCase()}`;
    const current = counts.get(key);
    counts.set(key, { ...token, count: (current?.count ?? 0) + 1 });
  }
  return counts;
}
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
