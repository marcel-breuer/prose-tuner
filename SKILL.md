---
name: prose-tuner
description: Refine German and English prose editorially while preserving meaning, protected content, Markdown structure, and provenance. Use for analyze, rewrite, or review requests; never use for detector evasion or provenance removal.
---

# ProseTuner

Use ProseTuner for local, provenance-safe editorial refinement of plain text and Markdown.

## Supported inputs and controls

- Languages: `de-DE`, `en-US`, and `en-GB`, with safe automatic detection.
- Modes: `analyze` reports editorial findings; `rewrite` returns revised text only; `review` returns revised text with a factual change report.
- Styles: `neutral`, `professional`, `academic`, `technical`, `blog`, `concise`, and `conversational`.
- Intensities: `light`, `balanced` (default), and `strong`.

## Mandatory workflow

1. Parse the input and retain its supplied provenance metadata.
2. Separate editable prose from Markdown structure and protected segments.
3. Run deterministic editorial analysis before any rewrite.
4. Rewrite only eligible prose using the selected style and intensity.
5. Restore protected segments and validate token-level and semantic integrity.
6. If a check fails or is uncertain, retain the original affected text and report the reason in review mode.

## Integrity and provenance rules

Always preserve meaning, facts, numbers, currencies, dates, URLs, DOIs, citations, quotations, identifiers, protected terminology, Markdown links, inline code, and fenced code blocks. Do not persist text or log a full document by default.

Never remove watermarks or provenance markers, bypass detectors, optimize for detector scores, or claim or conceal authorship. Do not add facts, citations, or unsupported claims.

Read [the workflow reference](references/workflow.md) and [the integrity reference](references/integrity.md) before implementing or invoking a rewrite path.
