import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  MockRewriteProvider,
  executeMode,
  runRewritePipeline,
  validateTokenIntegrity,
} from '../../src/index.js';

const fixture = (name: string) => readFile(new URL(`./${name}`, import.meta.url), 'utf8');

describe('regression fixtures', () => {
  it('rewrites English plain prose end to end without an external provider', async () => {
    const input = await fixture('plain-en-editorial.txt');
    const result = await runRewritePipeline(input, {
      language: 'en-US',
      provider: new MockRewriteProvider((request) => ({
        text: request.text.replace('very very verbose', 'concise'),
      })),
    });

    expect(result).toMatchObject({
      integrity: { status: 'passed' },
      text: 'This is concise prose. The team can use it to explain the plan.\n',
      transformedSegments: 1,
    });
  });

  it('preserves protected German Markdown facts while refining editable prose', async () => {
    const input = await fixture('complex-de-protected.md');
    const provider = new MockRewriteProvider((request) => ({
      text: request.text.replace('sehr sehr ausführlich', 'knapp'),
    }));
    const result = await executeMode(input, 'review', {
      language: 'de-DE',
      protectedTerms: [{ value: 'ProseTuner Core' }],
      provider,
    });

    expect(result).toMatchObject({
      changes: { integrityStatus: 'passed' },
      mode: 'review',
    });
    expect(result).toMatchSnapshot();
    if (result.mode !== 'review') throw new Error('Expected review result.');
    expect(result.text).toContain('Dieser Abschnitt ist knapp.');
    for (const protectedValue of [
      '50 %',
      '125.000 €',
      '2026-08-16',
      'https://example.com/bericht',
      'doi:10.1234/prose.tuner',
      '(Müller, 2025, S. 18)',
      '„Dieses Zitat bleibt unverändert.“',
      'ProseTuner Core',
      '[Referenz](https://example.com/referenz)',
      '`const status = "stable";`',
      'const protectedValue = 50;',
    ]) {
      expect(result.text).toContain(protectedValue);
    }
    for (const protectedValue of [
      'https://example.com/bericht,',
      'doi:10.1234/prose.tuner',
      '(Müller, 2025, S. 18)',
      '„Dieses Zitat bleibt unverändert.“',
      '[Referenz](https://example.com/referenz)',
      '`const status = "stable";`',
      'const protectedValue = 50;',
    ]) {
      expect(provider.requests.map((request) => request.text).join('')).not.toContain(
        protectedValue,
      );
    }
  });

  it.each([
    ['percentage', '50 %', '60 %'],
    ['currency', '125.000 €', '130.000 €'],
    ['date', '2026-08-16', '2026-08-17'],
    ['url', 'https://example.com/bericht,', 'https://example.com/changed,'],
    ['doi', 'doi:10.1234/prose.tuner', 'doi:10.1234/changed'],
    ['citation', '(Müller, 2025, S. 18)', '(Müller, 2026, S. 18)'],
    ['direct-quote', '„Dieses Zitat bleibt unverändert.“', '„Anderes Zitat.“'],
    ['protected-term', 'ProseTuner Core', 'Different Core'],
  ])('rejects corrupted %s fixture facts', async (_category, expected, changed) => {
    const original = await fixture('complex-de-protected.md');
    const result = validateTokenIntegrity(original, original.replace(expected, changed), {
      protectedTerms: [{ value: 'ProseTuner Core' }],
    });

    expect(result.status).toBe('failed');
    expect(result.failures).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'missing', token: expected })]),
    );
  });
});
