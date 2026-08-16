import type { LanguageResolution, SupportedLanguage } from '../language/types.js';
import type { TextRange } from '../parser/types.js';

export type FindingCategory =
  | 'filler'
  | 'heading-density'
  | 'lexical-redundancy'
  | 'meta-commentary'
  | 'nominal-style'
  | 'paragraph-length'
  | 'repeated-phrase'
  | 'repeated-sentence-opening'
  | 'sentence-length'
  | 'sentence-monotony'
  | 'transition';

export type FindingSeverity = 'info' | 'warning';

export const FINDING_CATEGORIES = [
  'filler',
  'heading-density',
  'lexical-redundancy',
  'meta-commentary',
  'nominal-style',
  'paragraph-length',
  'repeated-phrase',
  'repeated-sentence-opening',
  'sentence-length',
  'sentence-monotony',
  'transition',
] as const;

export interface StyleFinding {
  readonly category: FindingCategory;
  readonly message: string;
  readonly occurrences: number;
  readonly range: TextRange | undefined;
  readonly severity: FindingSeverity;
}

export interface AnalyzerThresholds {
  readonly fillerOccurrences: number;
  readonly headingDensityPer100Words: number;
  readonly longSentenceWords: number;
  readonly maximumParagraphWords: number;
  readonly metaPhraseOccurrences: number;
  readonly nominalStyleOccurrences: number;
  readonly repeatedPhraseOccurrences: number;
  readonly repeatedSentenceOpeningOccurrences: number;
  readonly sentenceMonotonyMinimum: number;
  readonly sentenceMonotonyTolerance: number;
  readonly transitionOccurrences: number;
}

export interface AnalyzeStyleOptions {
  readonly language?: SupportedLanguage | 'auto';
  readonly thresholds?: Partial<AnalyzerThresholds>;
}

export interface StyleAnalysis {
  readonly findings: readonly StyleFinding[];
  readonly language: LanguageResolution;
  readonly thresholds: AnalyzerThresholds;
}
