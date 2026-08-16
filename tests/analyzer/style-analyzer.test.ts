import { describe, expect, it } from 'vitest';

import { analyzeStyle } from '../../src/analyzer/index.js';

describe('deterministic style analysis', () => {
  it('finds configurable English editorial patterns with ranges', () => {
    const input = [
      '# One',
      '# Two',
      'However, this is very very clear. However, this is very very clear.',
      'It is important to note that future plans are useful.',
    ].join('\n\n');
    const analysis = analyzeStyle(input, {
      language: 'en-US',
      thresholds: { headingDensityPer100Words: 1, transitionOccurrences: 2 },
    });

    expect(analysis.findings.map((finding) => finding.category)).toEqual(
      expect.arrayContaining([
        'repeated-phrase',
        'repeated-sentence-opening',
        'transition',
        'filler',
        'meta-commentary',
        'lexical-redundancy',
        'heading-density',
      ]),
    );
    expect(
      analysis.findings.every((finding) => finding.range === undefined || finding.range.start >= 0),
    ).toBe(true);
  });

  it('finds German nominal-style candidates without external services', () => {
    const input = 'Die Durchführung der Planung und die Bewertung der Umsetzung sind wichtig.';
    const analysis = analyzeStyle(input, {
      language: 'de-DE',
      thresholds: { nominalStyleOccurrences: 3 },
    });

    expect(
      analysis.findings.find((finding) => finding.category === 'nominal-style')?.occurrences,
    ).toBeGreaterThanOrEqual(3);
  });

  it('reports sentence monotony at its configured boundary', () => {
    const analysis = analyzeStyle('One short sentence. Two short sentence. Three short sentence.', {
      language: 'en-US',
      thresholds: { sentenceMonotonyMinimum: 3, sentenceMonotonyTolerance: 0 },
    });

    expect(analysis.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ category: 'sentence-monotony' })]),
    );
  });
});
