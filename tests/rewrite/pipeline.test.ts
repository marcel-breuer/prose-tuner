import { describe, expect, it } from 'vitest';
import {
  MockRewriteProvider,
  runRewritePipeline,
} from '../../src/rewrite/index.js';
import { MockSemanticValidator } from '../../src/integrity/index.js';

describe('rewrite pipeline', () => {
  it('rewrites editable Markdown prose without sending protected segments to the provider', async () => {
    const provider = new MockRewriteProvider((request) => ({
      text: request.text.replace('verbose', 'concise'),
    }));
    const result = await runRewritePipeline(
      '# Heading\n\nThis is verbose. “Quoted text.” `code`',
      { language: 'en-US', provider },
    );
    expect(result).toMatchObject({
      text: '# Heading\n\nThis is concise. “Quoted text.” `code`',
      integrity: { status: 'passed' },
      transformedSegments: 1,
    });
    expect(provider.requests.join(' ')).not.toContain('Quoted text');
    expect(provider.requests.join(' ')).not.toContain('`code`');
  });

  it('falls back to original text when token validation fails', async () => {
    const result = await runRewritePipeline('The result is 50 % reliable.', {
      language: 'en-US',
      provider: new MockRewriteProvider((request) => ({
        text: request.text.replace('50 %', '60 %'),
      })),
    });
    expect(result).toMatchObject({
      text: 'The result is 50 % reliable.',
      integrity: { status: 'failed' },
      transformedSegments: 0,
    });
  });

  it('partially rejects semantic changes while preserving safe transformations', async () => {
    const validator = new MockSemanticValidator({
      reasons: [{ category: 'negation', message: 'Changed.' }],
      status: 'failed',
    });
    const result = await runRewritePipeline('This text is verbose.', {
      language: 'en-US',
      provider: new MockRewriteProvider(() => ({ text: 'This text is concise.' })),
      semanticValidator: validator,
    });
    expect(result).toMatchObject({ text: 'This text is verbose.', rejectedSegments: 1 });
  });
});
