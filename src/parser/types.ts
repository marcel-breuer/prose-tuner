export type InputFormat = 'plain-text' | 'markdown';

export type ProtectedContentKind =
  | 'citation'
  | 'direct-quote'
  | 'doi'
  | 'footnote-reference'
  | 'inline-code'
  | 'isbn'
  | 'markdown-link'
  | 'url'
  | 'fenced-code-block';

export interface TextRange {
  readonly start: number;
  readonly end: number;
}

export interface EditableSegment {
  readonly kind: 'editable';
  readonly range: TextRange;
  readonly value: string;
}

export interface ProtectedSegment {
  readonly kind: 'protected';
  readonly protectedKind: ProtectedContentKind;
  readonly range: TextRange;
  readonly value: string;
}

export interface StructureSegment {
  readonly kind: 'structure';
  readonly range: TextRange;
  readonly value: string;
}

export type DocumentSegment = EditableSegment | ProtectedSegment | StructureSegment;

export interface ParseDocumentOptions {
  readonly format?: InputFormat;
  readonly preserveStructure?: boolean;
}

export interface ParsedDocument {
  readonly format: InputFormat;
  readonly preserveStructure: boolean;
  readonly source: string;
  readonly segments: readonly DocumentSegment[];
}
