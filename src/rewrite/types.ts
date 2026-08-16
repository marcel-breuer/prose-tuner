import type { SupportedLanguage } from '../language/types.js';

export interface RewriteRequest {
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
