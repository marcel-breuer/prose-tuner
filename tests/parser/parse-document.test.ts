import { describe, expect, it } from 'vitest';

import {
  EditableReplacementCountError,
  detectInputFormat,
  mapEditableSegments,
  parseDocument,
  renderDocument,
} from '../../src/parser/index.js';

describe('parseDocument', () => {
  const markdown = `# Überblick

Dieser sehr sehr ausführliche Text enthält [eine Quelle](https://example.com/path) und „ein Zitat“.
Die Studie (Müller, 2025, S. 18) verweist auf doi:10.1234/example und [^source].
Nutze \`inline code\` unverändert.

\`\`\`ts
const amount = '125.000 €';
\`\`\`
`;

  it('round-trips Markdown byte-for-byte while preserving structure', () => {
    const document = parseDocument(markdown, { format: 'markdown', preserveStructure: true });

    expect(renderDocument(document, editableValues(document))).toBe(markdown);
    expect(document.segments.some((segment) => segment.kind === 'structure')).toBe(true);
    expect(protectedKinds(document)).toEqual(
      expect.arrayContaining([
        'markdown-link',
        'direct-quote',
        'citation',
        'doi',
        'footnote-reference',
        'inline-code',
        'fenced-code-block',
      ]),
    );
  });

  it('replaces only editable prose and restores protected segments byte-for-byte', () => {
    const document = parseDocument(markdown, { format: 'markdown' });
    const revised = mapEditableSegments(document, (segment) =>
      segment.value.replace('sehr sehr ausführliche', 'knappe'),
    );

    expect(revised).toContain('Dieser knappe Text');
    expect(revised).toContain('[eine Quelle](https://example.com/path)');
    expect(revised).toContain('„ein Zitat“');
    expect(revised).toContain('(Müller, 2025, S. 18)');
    expect(revised).toContain('doi:10.1234/example');
    expect(revised).toContain("const amount = '125.000 €';");
  });

  it('supports structure-preservation opt-out without changing the original input', () => {
    const document = parseDocument('# Heading\n\n- Item', {
      format: 'markdown',
      preserveStructure: false,
    });

    expect(document.segments.every((segment) => segment.kind !== 'structure')).toBe(true);
    expect(renderDocument(document, editableValues(document))).toBe('# Heading\n\n- Item');
  });

  it('detects plain text and rejects incomplete replacement sets', () => {
    const document = parseDocument('A plain sentence with https://example.com.');

    expect(detectInputFormat(document.source)).toBe('plain-text');
    expect(() => renderDocument(document, [])).toThrow(EditableReplacementCountError);
  });
});

function editableValues(document: ReturnType<typeof parseDocument>): readonly string[] {
  return document.segments
    .filter((segment) => segment.kind === 'editable')
    .map((segment) => segment.value);
}

function protectedKinds(document: ReturnType<typeof parseDocument>): readonly string[] {
  return document.segments
    .filter((segment) => segment.kind === 'protected')
    .map((segment) => segment.protectedKind);
}
