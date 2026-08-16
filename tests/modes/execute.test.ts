import { describe, expect, it } from 'vitest';
import { executeMode, MockRewriteProvider } from '../../src/index.js';

describe('execution modes', () => {
  it('analyzes without calling a rewrite provider', async () => {
    const provider = new MockRewriteProvider();
    const result = await executeMode('This is very very clear.', 'analyze', {
      language: 'en-US',
      provider,
    });
    expect(result).toMatchObject({ mode: 'analyze', report: { metrics: expect.any(Object) } });
    expect(provider.requests).toHaveLength(0);
  });

  it('returns clean revised text in rewrite mode', async () => {
    const result = await executeMode('This is verbose.', 'rewrite', {
      language: 'en-US',
      provider: new MockRewriteProvider((request) => ({
        text: request.text.replace('verbose', 'concise'),
      })),
    });
    expect(result).toEqual({ mode: 'rewrite', text: 'This is concise.' });
  });

  it('returns factual transformation details in review mode', async () => {
    const result = await executeMode('This is verbose.', 'review', {
      language: 'en-US',
      provider: new MockRewriteProvider((request) => ({
        text: request.text.replace('verbose', 'concise'),
      })),
    });
    expect(result).toMatchObject({
      mode: 'review',
      text: 'This is concise.',
      changes: { appliedSegments: 1, rejectedSegments: 0, integrityStatus: 'passed' },
    });
  });
});
