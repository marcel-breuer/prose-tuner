import { describe, expect, it } from 'vitest';

import {
  createAnalysisReport,
  formatAnalysisReportMarkdown,
  serializeAnalysisReport,
} from '../../src/analyzer/index.js';

describe('analysis reports', () => {
  it('returns a zero-safe reusable report for clean input', () => {
    const report = createAnalysisReport('A concise sentence.', { language: 'en-US' });

    expect(report.summary.totalFindings).toBe(0);
    expect(report.metrics).toEqual({
      averageSentenceLength: 3,
      fillerPhraseCount: 0,
      headingDensityPer100Words: 0,
      repetitionCount: 0,
      transitionFrequency: 0,
    });
    expect(JSON.parse(serializeAnalysisReport(report))).toEqual(report);
  });

  it('formats stable Markdown with actionable editorial locations', () => {
    const report = createAnalysisReport(
      'However, this is very very clear. However, this is very very clear.',
      { language: 'en-US', thresholds: { fillerOccurrences: 2, transitionOccurrences: 2 } },
    );

    expect(formatAnalysisReportMarkdown(report)).toMatchInlineSnapshot(`
      "# Editorial analysis

      ## Summary

      - Findings: 7
      - Warnings: 7
      - Informational findings: 0
      - Language: en-US (explicit)

      ## Metrics

      - Average sentence length: 6
      - Repetition count: 10
      - Transition frequency: 2
      - Filler phrase count: 4
      - Heading density per 100 words: 0

      ## Findings

      - **warning · transition** (characters 0-7): Repeated transition phrase: “however”.
      - **warning · filler** (characters 17-21): Repeated filler or intensifier: “very”.
      - **warning · repeated-phrase** (characters 34-50): Repeated phrase: “however this is”.
      - **warning · repeated-sentence-opening** (characters 34-67): Repeated sentence opening: “however this is”.
      - **warning · repeated-phrase** (characters 43-55): Repeated phrase: “this is very”.
      - **warning · repeated-phrase** (characters 48-60): Repeated phrase: “is very very”.
      - **warning · repeated-phrase** (characters 51-66): Repeated phrase: “very very clear”.
      "
    `);
  });
});
