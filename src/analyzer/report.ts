import { analyzeStyle } from './style-analyzer.js';
import { FINDING_CATEGORIES } from './types.js';
import type {
  AnalyzeStyleOptions,
  FindingCategory,
  FindingSeverity,
  StyleAnalysis,
  StyleFinding,
} from './types.js';

export interface AnalysisMetrics {
  readonly averageSentenceLength: number;
  readonly fillerPhraseCount: number;
  readonly headingDensityPer100Words: number;
  readonly repetitionCount: number;
  readonly transitionFrequency: number;
}

export interface AnalysisSummary {
  readonly byCategory: Readonly<Record<FindingCategory, number>>;
  readonly bySeverity: Readonly<Record<FindingSeverity, number>>;
  readonly totalFindings: number;
}

export interface AnalysisReport {
  readonly findings: readonly StyleFinding[];
  readonly language: {
    readonly code: string | null;
    readonly source: StyleAnalysis['language']['source'];
  };
  readonly metrics: AnalysisMetrics;
  readonly summary: AnalysisSummary;
  readonly version: 1;
}

export function createAnalysisReport(
  input: string,
  options: AnalyzeStyleOptions = {},
): AnalysisReport {
  const analysis = analyzeStyle(input, options);

  return {
    findings: analysis.findings,
    language: {
      code: analysis.language.language ?? null,
      source: analysis.language.source,
    },
    metrics: calculateMetrics(input, analysis.findings),
    summary: summarizeFindings(analysis.findings),
    version: 1,
  };
}

export function formatAnalysisReportMarkdown(report: AnalysisReport): string {
  const lines = [
    '# Editorial analysis',
    '',
    '## Summary',
    '',
    `- Findings: ${report.summary.totalFindings}`,
    `- Warnings: ${report.summary.bySeverity.warning}`,
    `- Informational findings: ${report.summary.bySeverity.info}`,
    `- Language: ${report.language.code ?? 'undetermined'} (${report.language.source})`,
    '',
    '## Metrics',
    '',
    `- Average sentence length: ${report.metrics.averageSentenceLength}`,
    `- Repetition count: ${report.metrics.repetitionCount}`,
    `- Transition frequency: ${report.metrics.transitionFrequency}`,
    `- Filler phrase count: ${report.metrics.fillerPhraseCount}`,
    `- Heading density per 100 words: ${report.metrics.headingDensityPer100Words}`,
    '',
    '## Findings',
    '',
  ];

  if (report.findings.length === 0) {
    lines.push('- No editorial findings.');
  } else {
    lines.push(
      ...report.findings.map((finding) => {
        const location =
          finding.range === undefined
            ? ''
            : ` (characters ${finding.range.start}-${finding.range.end})`;
        return `- **${finding.severity} · ${finding.category}**${location}: ${finding.message}`;
      }),
    );
  }

  return `${lines.join('\n')}\n`;
}

export function serializeAnalysisReport(report: AnalysisReport): string {
  return JSON.stringify(report, null, 2);
}

function calculateMetrics(input: string, findings: readonly StyleFinding[]): AnalysisMetrics {
  const words = input.match(/\p{L}+/gu) ?? [];
  const sentenceLengths = (input.match(/[^.!?\r\n]+[.!?]+|[^.!?\r\n]+$/gm) ?? []).map(
    (sentence) => sentence.match(/\p{L}+/gu)?.length ?? 0,
  );
  const headingCount = [...input.matchAll(/^ {0,3}#{1,6}\s+.+$/gm)].length;

  return {
    averageSentenceLength:
      sentenceLengths.length === 0
        ? 0
        : round(sentenceLengths.reduce((sum, length) => sum + length, 0) / sentenceLengths.length),
    fillerPhraseCount: countOccurrences(findings, 'filler'),
    headingDensityPer100Words: words.length === 0 ? 0 : round((headingCount / words.length) * 100),
    repetitionCount:
      countOccurrences(findings, 'repeated-phrase') +
      countOccurrences(findings, 'repeated-sentence-opening'),
    transitionFrequency: countOccurrences(findings, 'transition'),
  };
}

function summarizeFindings(findings: readonly StyleFinding[]): AnalysisSummary {
  const byCategory = Object.fromEntries(
    FINDING_CATEGORIES.map((category) => [category, 0]),
  ) as Record<FindingCategory, number>;
  const bySeverity: Record<FindingSeverity, number> = { info: 0, warning: 0 };

  for (const finding of findings) {
    byCategory[finding.category] += 1;
    bySeverity[finding.severity] += 1;
  }

  return { byCategory, bySeverity, totalFindings: findings.length };
}

function countOccurrences(findings: readonly StyleFinding[], category: FindingCategory): number {
  return findings
    .filter((finding) => finding.category === category)
    .reduce((sum, finding) => sum + finding.occurrences, 0);
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
