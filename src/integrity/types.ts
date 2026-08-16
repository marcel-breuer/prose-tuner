import type { TextRange } from '../parser/types.js';

export type IntegrityTokenCategory =
  | 'citation'
  | 'currency'
  | 'date'
  | 'direct-quote'
  | 'doi'
  | 'number'
  | 'percentage'
  | 'protected-term'
  | 'url';

export interface ProtectedTerm {
  readonly caseSensitive?: boolean;
  readonly value: string;
}
export interface IntegrityOptions {
  readonly protectedTerms?: readonly ProtectedTerm[];
}
export interface IntegrityToken {
  readonly category: IntegrityTokenCategory;
  readonly range: TextRange;
  readonly value: string;
  readonly caseSensitive: boolean;
}
export interface IntegrityFailure {
  readonly category: IntegrityTokenCategory;
  readonly token: string;
  readonly reason: 'missing' | 'unexpected';
}
export interface IntegrityValidationResult {
  readonly failures: readonly IntegrityFailure[];
  readonly status: 'passed' | 'failed';
}
