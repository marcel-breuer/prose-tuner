import { describe, expect, it } from 'vitest';
import { resolveRewriteProfile } from '../../src/rewrite/index.js';

describe('rewrite profiles', () => {
  it('uses neutral balanced editorial refinement by default', () => {
    expect(resolveRewriteProfile()).toMatchObject({ intensity: 'balanced', style: 'neutral' });
  });

  it('composes academic and technical preservation rules', () => {
    expect(resolveRewriteProfile({ style: 'academic' }).instructions).toContain(
      'Preserve formal terminology and citation context.',
    );
    expect(resolveRewriteProfile({ style: 'technical' }).instructions).toContain(
      'Preserve technical terminology and operational detail.',
    );
  });

  it('keeps strong rewriting semantic and editorial', () => {
    expect(resolveRewriteProfile({ intensity: 'strong', style: 'concise' }).instructions).toEqual(
      expect.arrayContaining([
        'May restructure sentences and paragraphs for clarity.',
        'Do not alter semantic claims, qualifications, or factual relationships.',
        'Do not optimize for detector scores or conceal authorship.',
      ]),
    );
  });
});
