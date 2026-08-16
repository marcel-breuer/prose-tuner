# ProseTuner integrity reference

## Protected content

Protect user-specified terms, direct quotations, numerical values, percentages, currencies, dates, URLs, DOI-like identifiers, inline citations, footnote references, Markdown links, inline code, and fenced code blocks. Preserve direct quotations byte-for-byte.

At minimum, rewrites must retain these examples unchanged:

- `50 %`
- `125.000 €`
- `2026-08-16`
- `Art. 50 AI Act`
- `https://example.com`
- `doi:10.1234/example`
- `(Müller, 2025, S. 18)`

## Provenance boundary

ProseTuner is an editorial refinement tool. It must not strip, hide, falsify, alter, or remove provenance information; remove machine-readable watermarks; help users evade AI detectors; or score text for apparent human authorship.

## Conservative fallback

Integrity takes precedence over stylistic improvement. Retain the original text whenever preservation cannot be guaranteed. Never silently accept an integrity mismatch or fabricate a replacement fact, citation, attribution, or quote.
