import { describe, expect, it } from 'vitest';

import { detectLanguage, getRuleRegistry, resolveLanguage } from '../../src/language/index.js';

describe('language detection', () => {
  it('detects German and selects the German rules', () => {
    const resolution = resolveLanguage({
      text: 'Dies ist ein deutscher Text und er enthält eine klare Aussage.',
    });

    expect(resolution).toMatchObject({
      language: 'de-DE',
      source: 'detected',
      registry: { family: 'german' },
    });
  });

  it('detects English and supports a configured English variant', () => {
    const detection = detectLanguage(
      'This is an English text and it contains a clear statement.',
      'en-GB',
    );

    expect(detection).toMatchObject({ language: 'en-GB', confidence: 'high' });
    expect(getRuleRegistry('en-US').family).toBe('english');
    expect(getRuleRegistry('en-GB').language).toBe('en-GB');
  });

  it('always prefers an explicit locale over automatic detection', () => {
    const resolution = resolveLanguage({
      language: 'de-DE',
      text: 'This is an English text and it contains a clear statement.',
    });

    expect(resolution).toMatchObject({ language: 'de-DE', source: 'explicit' });
  });

  it('returns no registry for unknown or ambiguous input', () => {
    const resolution = resolveLanguage({ text: '12345 / ???' });

    expect(resolution).toMatchObject({
      confidence: 'low',
      language: undefined,
      registry: undefined,
      source: 'ambiguous',
    });
  });
});
