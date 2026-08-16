import { describe, expect, it } from 'vitest';
import {
  DeterministicSemanticValidator,
  MockSemanticValidator,
  validateWithSemanticFallback,
} from '../../src/integrity/index.js';

describe('semantic integrity validation', () => {
  it('rejects changed negation and legal qualifiers', async () => {
    const validator = new DeterministicSemanticValidator();
    await expect(
      validator.validate({
        language: 'en-US',
        original: 'The provider must not publish if approval is absent.',
        rewritten: 'The provider may publish when approval is absent.',
      }),
    ).resolves.toMatchObject({
      status: 'failed',
      reasons: expect.arrayContaining([
        expect.objectContaining({ category: 'negation' }),
        expect.objectContaining({ category: 'modality' }),
        expect.objectContaining({ category: 'legal-qualifier' }),
      ]),
    });
  });

  it('retains the original text when validation is uncertain', async () => {
    const fallback = await validateWithSemanticFallback(
      new MockSemanticValidator({
        reasons: [{ category: 'probability', message: 'Equivalence cannot be established.' }],
        status: 'uncertain',
      }),
      { language: 'en-US', original: 'The result is likely.', rewritten: 'The result is certain.' },
    );
    expect(fallback).toMatchObject({
      text: 'The result is likely.',
      result: { status: 'uncertain' },
    });
  });

  it('allows configured opt-out without changing content itself', async () => {
    const fallback = await validateWithSemanticFallback(
      new MockSemanticValidator({ reasons: [], status: 'failed' }),
      { language: 'de-DE', original: 'Original.', rewritten: 'Überarbeitet.' },
      { enabled: false },
    );
    expect(fallback.text).toBe('Überarbeitet.');
  });
});
