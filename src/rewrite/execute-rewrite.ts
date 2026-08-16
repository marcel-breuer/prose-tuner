import type {
  RewriteExecutionOptions,
  RewriteProvider,
  RewriteRequest,
  RewriteResult,
} from './types.js';
import { RewriteProviderError } from './types.js';

const DEFAULT_TIMEOUT_MS = 30_000;

/** Executes an injected provider without logging or otherwise retaining document text. */
export async function executeRewrite(
  provider: RewriteProvider,
  request: RewriteRequest,
  options: RewriteExecutionOptions = {},
): Promise<RewriteResult> {
  const maxRetries = options.maxRetries ?? 0;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    try {
      return await withTimeout(provider.rewrite(request), timeoutMs);
    } catch (error) {
      if (attempt > maxRetries || error instanceof TimeoutError) {
        throw new RewriteProviderError(
          error instanceof TimeoutError ? 'timeout' : 'provider-failure',
          attempt,
        );
      }
    }
  }

  throw new RewriteProviderError('provider-failure', maxRetries + 1);
}

class TimeoutError extends Error {
  public constructor() {
    super('Timed out.');
  }
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), timeoutMs);
    operation.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
