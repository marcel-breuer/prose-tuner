import type { EditableSegment, ParsedDocument } from './types.js';

export class EditableReplacementCountError extends Error {
  public constructor(expected: number, received: number) {
    super(`Expected ${expected} editable replacements but received ${received}.`);
    this.name = 'EditableReplacementCountError';
  }
}

/**
 * Restores a parsed document with replacements applied solely to editable prose.
 * Protected and structural segments always retain their original bytes.
 */
export function renderDocument(document: ParsedDocument, replacements: readonly string[]): string {
  const editableSegments = document.segments.filter(
    (segment): segment is EditableSegment => segment.kind === 'editable',
  );

  if (replacements.length !== editableSegments.length) {
    throw new EditableReplacementCountError(editableSegments.length, replacements.length);
  }

  let replacementIndex = 0;

  return document.segments
    .map((segment) => {
      if (segment.kind !== 'editable') {
        return segment.value;
      }

      const replacement = replacements[replacementIndex];
      replacementIndex += 1;
      return replacement;
    })
    .join('');
}

export function mapEditableSegments(
  document: ParsedDocument,
  mapper: (segment: EditableSegment, index: number) => string,
): string {
  let index = 0;

  return renderDocument(
    document,
    document.segments.flatMap((segment) => {
      if (segment.kind !== 'editable') {
        return [];
      }

      const replacement = mapper(segment, index);
      index += 1;
      return [replacement];
    }),
  );
}
