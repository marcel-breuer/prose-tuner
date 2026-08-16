import type { SupportedLanguage } from '../language/types.js';

export const REWRITE_STYLES = [
  'neutral',
  'professional',
  'academic',
  'technical',
  'blog',
  'concise',
  'conversational',
] as const;
export const REWRITE_INTENSITIES = ['light', 'balanced', 'strong'] as const;
export type RewriteStyle = (typeof REWRITE_STYLES)[number];
export type RewriteIntensity = (typeof REWRITE_INTENSITIES)[number];

export interface RewriteProfileOptions {
  readonly intensity?: RewriteIntensity;
  readonly style?: RewriteStyle;
}

export interface ResolvedRewriteProfile {
  readonly instructions: readonly string[];
  readonly intensity: RewriteIntensity;
  readonly style: RewriteStyle;
}

export interface RewriteRequest {
  readonly instructions?: readonly string[];
  readonly language: SupportedLanguage;
  readonly text: string;
}

export interface RewriteResult {
  readonly text: string;
}

export interface RewriteProvider {
  readonly name: string;
  rewrite(request: RewriteRequest): Promise<RewriteResult>;
}

export interface RewriteExecutionOptions {
  readonly maxRetries?: number;
  readonly timeoutMs?: number;
}

export class RewriteProviderError extends Error {
  public constructor(
    public readonly code: 'provider-failure' | 'timeout',
    public readonly attempts: number,
  ) {
    super(code === 'timeout' ? 'The rewrite provider timed out.' : 'The rewrite provider failed.');
    this.name = 'RewriteProviderError';
  }
}
