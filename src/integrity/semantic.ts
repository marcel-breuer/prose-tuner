import type { SupportedLanguage } from '../language/types.js';

export type SemanticValidationStatus = 'passed' | 'failed' | 'uncertain';
export type SemanticReasonCategory =
  'causality' | 'legal-qualifier' | 'modality' | 'negation' | 'probability' | 'responsibility';
export interface SemanticValidationReason {
  readonly category: SemanticReasonCategory;
  readonly message: string;
}
export interface SemanticValidationRequest {
  readonly language: SupportedLanguage;
  readonly original: string;
  readonly rewritten: string;
}
export interface SemanticValidationResult {
  readonly reasons: readonly SemanticValidationReason[];
  readonly status: SemanticValidationStatus;
}
export interface SemanticValidator {
  validate(request: SemanticValidationRequest): Promise<SemanticValidationResult>;
}
export interface SemanticValidationOptions {
  readonly enabled?: boolean;
}
export const DEFAULT_SEMANTIC_VALIDATION_OPTIONS: Required<SemanticValidationOptions> = {
  enabled: true,
};

const MARKERS: Readonly<Record<SemanticReasonCategory, readonly string[]>> = {
  causality: ['because', 'therefore', 'due to', 'causes', 'weil', 'daher', 'führt zu'],
  'legal-qualifier': [
    'if',
    'unless',
    'subject to',
    'provided that',
    'wenn',
    'sofern',
    'vorbehaltlich',
  ],
  modality: ['must', 'may', 'should', 'can', 'muss', 'darf', 'sollte', 'kann'],
  negation: ['not', 'never', 'no', 'without', 'nicht', 'kein', 'keine', 'niemals', 'ohne'],
  probability: [
    'likely',
    'possibly',
    'perhaps',
    'certainly',
    'wahrscheinlich',
    'möglicherweise',
    'vielleicht',
    'sicherlich',
  ],
  responsibility: ['responsible', 'liable', 'accountable', 'verantwortlich', 'haftet', 'zuständig'],
};

export class DeterministicSemanticValidator implements SemanticValidator {
  public async validate(request: SemanticValidationRequest): Promise<SemanticValidationResult> {
    const reasons = (Object.keys(MARKERS) as SemanticReasonCategory[]).flatMap((category) => {
      const original = markerFingerprint(request.original, MARKERS[category]);
      const rewritten = markerFingerprint(request.rewritten, MARKERS[category]);
      return original === rewritten
        ? []
        : [{ category, message: `Potential ${category} change detected.` }];
    });
    return { reasons, status: reasons.length === 0 ? 'passed' : 'failed' };
  }
}

export class MockSemanticValidator implements SemanticValidator {
  public constructor(private readonly result: SemanticValidationResult) {}
  public async validate(): Promise<SemanticValidationResult> {
    return this.result;
  }
}

export async function validateWithSemanticFallback(
  validator: SemanticValidator,
  request: SemanticValidationRequest,
  options: SemanticValidationOptions = {},
): Promise<{ readonly result: SemanticValidationResult; readonly text: string }> {
  if (!(options.enabled ?? DEFAULT_SEMANTIC_VALIDATION_OPTIONS.enabled)) {
    return { result: { reasons: [], status: 'passed' }, text: request.rewritten };
  }
  const result = await validator.validate(request);
  return { result, text: result.status === 'passed' ? request.rewritten : request.original };
}

function markerFingerprint(input: string, markers: readonly string[]): string {
  const normalized = input.toLocaleLowerCase();
  return markers
    .flatMap((marker) =>
      Array.from(
        normalized.matchAll(new RegExp(`(?<!\\p{L})${escapeRegExp(marker)}(?!\\p{L})`, 'gu')),
        () => marker,
      ),
    )
    .sort()
    .join('\u0000');
}
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
