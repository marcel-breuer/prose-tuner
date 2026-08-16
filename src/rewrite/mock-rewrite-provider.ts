import type { RewriteProvider, RewriteRequest, RewriteResult } from './types.js';

export type MockRewriteHandler = (
  request: RewriteRequest,
) => RewriteResult | Promise<RewriteResult>;

/** Deterministic test double; it performs no I/O and keeps no diagnostics. */
export class MockRewriteProvider implements RewriteProvider {
  public readonly name = 'mock';
  public readonly requests: RewriteRequest[] = [];

  public constructor(
    private readonly handler: MockRewriteHandler = (request) => ({ text: request.text }),
  ) {}

  public async rewrite(request: RewriteRequest): Promise<RewriteResult> {
    this.requests.push(request);
    return this.handler(request);
  }
}
