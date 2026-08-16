import { createAnalysisReport } from '../analyzer/index.js';
import type { AnalysisReport } from '../analyzer/index.js';
import { runRewritePipeline } from '../rewrite/index.js';
import type { RewritePipelineOptions, RewritePipelineResult } from '../rewrite/index.js';

export type ProseTunerMode = 'analyze' | 'rewrite' | 'review';
export interface AnalyzeModeOptions {
  readonly language?: RewritePipelineOptions['language'];
}
export type RewriteModeOptions = RewritePipelineOptions;
export interface ReviewChangeReport {
  readonly appliedSegments: number;
  readonly integrityStatus: RewritePipelineResult['integrity']['status'];
  readonly rejectedSegments: number;
  readonly summary: readonly string[];
}
export type ModeResult =
  | { readonly mode: 'analyze'; readonly report: AnalysisReport }
  | { readonly mode: 'rewrite'; readonly text: string }
  | { readonly changes: ReviewChangeReport; readonly mode: 'review'; readonly text: string };

export async function executeMode(
  input: string,
  mode: ProseTunerMode,
  options: AnalyzeModeOptions | RewriteModeOptions = {},
): Promise<ModeResult> {
  if (mode === 'analyze') {
    const analyzeOptions = options as AnalyzeModeOptions;
    return {
      mode,
      report: createAnalysisReport(input, {
        ...(analyzeOptions.language === undefined ? {} : { language: analyzeOptions.language }),
      }),
    };
  }
  const pipeline = await runRewritePipeline(input, options as RewriteModeOptions);
  if (mode === 'rewrite') return { mode, text: pipeline.text };
  return { changes: createChangeReport(pipeline), mode, text: pipeline.text };
}

function createChangeReport(result: RewritePipelineResult): ReviewChangeReport {
  const summary = [
    ...(result.transformedSegments === 0
      ? []
      : [`Applied editorial refinement to ${result.transformedSegments} editable segment(s).`]),
    ...(result.rejectedSegments === 0
      ? []
      : [`Retained ${result.rejectedSegments} segment(s) after semantic validation.`]),
    ...(result.integrity.status === 'passed'
      ? []
      : ['Retained the original document after token integrity validation failed.']),
  ];
  return {
    appliedSegments: result.transformedSegments,
    integrityStatus: result.integrity.status,
    rejectedSegments: result.rejectedSegments,
    summary,
  };
}
