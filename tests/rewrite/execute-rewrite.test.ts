import { describe, expect, it } from 'vitest';

import { executeRewrite, MockRewriteProvider } from '../../src/rewrite/index.js';

describe('rewrite provider abstraction', () => {
  it('uses an injected deterministic provider without provider SDKs', async () => {
    const provider = new MockRewriteProvider((request) => ({
      text: request.text.replace('verbose', 'concise'),
    }));

    await expect(
      executeRewrite(provider, { language: 'en-US', text: 'verbose text' }),
    ).resolves.toEqual({ text: 'concise text' });
    expect(provider.requests).toHaveLength(1);
  });

  it('retries provider failures and returns a typed generic error', async () => {
    let calls = 0;
    const provider = new MockRewriteProvider(() => {
      calls += 1;
      if (calls === 1) {
        throw new Error('provider-specific diagnostic containing input');
      }
      return { text: 'revised' };
    });

    await expect(
      executeRewrite(provider, { language: 'en-US', text: 'private input' }, { maxRetries: 1 }),
    ).resolves.toEqual({ text: 'revised' });
    await expect(
      executeRewrite(
        new MockRewriteProvider(() => {
          throw new Error('private input');
        }),
        { language: 'en-US', text: 'private input' },
      ),
    ).rejects.toMatchObject({ code: 'provider-failure', attempts: 1 });
  });

  it('fails timeouts without leaking the supplied text', async () => {
    const provider = new MockRewriteProvider(() => new Promise(() => undefined));

    await expect(
      executeRewrite(provider, { language: 'en-US', text: 'private input' }, { timeoutMs: 1 }),
    ).rejects.toEqual(
      expect.objectContaining({ code: 'timeout', message: 'The rewrite provider timed out.' }),
    );
  });
});
