import { analyzeStyle } from '../analyzer/index.js';
import { validateTokenIntegrity } from '../integrity/index.js';
import {
  DeterministicSemanticValidator,
  validateWithSemanticFallback,
} from '../integrity/semantic.js';
import type {
  IntegrityOptions,
  IntegrityValidationResult,
  SemanticValidationOptions,
  SemanticValidationResult,
  SemanticValidator,
} from '../integrity/index.js';
import { resolveLanguage } from '../language/index.js';
import type { LanguagePreference, LanguageResolution } from '../language/types.js';
import { parseDocument, renderDocument } from '../parser/index.js';
import { executeRewrite } from './execute-rewrite.js';
import { resolveRewriteProfile } from './profiles.js';
import type {
  ResolvedRewriteProfile,
  RewriteExecutionOptions,
  RewriteIntensity,
  RewriteProvider,
  RewriteStyle,
} from './types.js';

export interface RewritePipelineOptions extends IntegrityOptions {
  readonly execution?: RewriteExecutionOptions;
  readonly intensity?: RewriteIntensity;
  readonly language?: LanguagePreference;
  readonly provider: RewriteProvider;
  readonly semanticValidation?: SemanticValidationOptions;
  readonly semanticValidator?: SemanticValidator;
  readonly style?: RewriteStyle;
}
export interface RewritePipelineResult {
  readonly analysis: ReturnType<typeof analyzeStyle>;
  readonly integrity: IntegrityValidationResult;
  readonly language: LanguageResolution;
  readonly profile: ResolvedRewriteProfile;
  readonly rejectedSegments: number;
  readonly semanticResults: readonly SemanticValidationResult[];
  readonly text: string;
  readonly transformedSegments: number;
}
export class RewritePipelineError extends Error {
  public constructor(public readonly code: 'language-undetermined') {
    super('A supported language must be selected or detected before rewriting.');
    this.name = 'RewritePipelineError';
  }
}

export async function runRewritePipeline(
  input: string,
  options: RewritePipelineOptions,
): Promise<RewritePipelineResult> {
  const language = resolveLanguage({
    ...(options.language === undefined ? {} : { language: options.language }),
    text: input,
  });
  if (language.language === undefined) throw new RewritePipelineError('language-undetermined');
  const analysis = analyzeStyle(input, { language: language.language });
  const profile = resolveRewriteProfile({
    ...(options.intensity === undefined ? {} : { intensity: options.intensity }),
    ...(options.style === undefined ? {} : { style: options.style }),
  });
  const document = parseDocument(input, { preserveStructure: true });
  const validator = options.semanticValidator ?? new DeterministicSemanticValidator();
  const replacements: string[] = [];
  const semanticResults: SemanticValidationResult[] = [];
  let transformedSegments = 0;
  let rejectedSegments = 0;

  for (const segment of document.segments) {
    if (segment.kind !== 'editable') continue;
    if (segment.value.trim().length === 0) {
      replacements.push(segment.value);
      continue;
    }
    const rewritten = await executeRewrite(
      options.provider,
      { instructions: profile.instructions, language: language.language, text: segment.value },
      options.execution,
    );
    const fallback = await validateWithSemanticFallback(
      validator,
      { language: language.language, original: segment.value, rewritten: rewritten.text },
      options.semanticValidation,
    );
    replacements.push(fallback.text);
    semanticResults.push(fallback.result);
    if (fallback.result.status === 'passed') transformedSegments += 1;
    else rejectedSegments += 1;
  }

  const candidate = renderDocument(document, replacements);
  const integrity = validateTokenIntegrity(input, candidate, {
    ...(options.protectedTerms === undefined ? {} : { protectedTerms: options.protectedTerms }),
  });
  return {
    analysis,
    integrity,
    language,
    profile,
    rejectedSegments,
    semanticResults,
    text: integrity.status === 'passed' ? candidate : input,
    transformedSegments: integrity.status === 'passed' ? transformedSegments : 0,
  };
}
