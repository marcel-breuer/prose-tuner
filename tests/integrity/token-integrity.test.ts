import { describe, expect, it } from 'vitest';
import { validateTokenIntegrity } from '../../src/integrity/index.js';

describe('token integrity validation', () => {
  const original =
    '50 % cost 125.000 € on 2026-08-16. See https://example.com and doi:10.1234/example (Müller, 2025, S. 18). “Exact quote.” OpenAI API remains protected.';

  it('accepts protected factual tokens unchanged', () => {
    expect(
      validateTokenIntegrity(original, `Revised: ${original}`, {
        protectedTerms: [{ value: 'OpenAI API' }],
      }),
    ).toMatchObject({ status: 'passed', failures: [] });
  });

  it('reports changed high-risk tokens by category', () => {
    const result = validateTokenIntegrity(
      original,
      original
        .replace('50 %', '60 %')
        .replace('2026-08-16', '2026-08-17')
        .replace('“Exact quote.”', '“Changed quote.”'),
    );
    expect(result.status).toBe('failed');
    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'percentage', reason: 'missing', token: '50 %' }),
        expect.objectContaining({ category: 'date', reason: 'missing', token: '2026-08-16' }),
        expect.objectContaining({
          category: 'direct-quote',
          reason: 'missing',
          token: '“Exact quote.”',
        }),
      ]),
    );
  });

  it('supports case-insensitive protected terms', () => {
    expect(
      validateTokenIntegrity('Use ProseTuner.', 'Use prosetuner.', {
        protectedTerms: [{ caseSensitive: false, value: 'ProseTuner' }],
      }).status,
    ).toBe('passed');
  });
});
