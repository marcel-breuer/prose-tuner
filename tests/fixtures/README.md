# Regression fixtures

Fixtures reproduce a confirmed defect with the smallest useful input. Name each fixture as `<language>-<area>-<scenario>.<md|txt>`, for example `de-parser-citation.md`.

Every fixture must have a colocated test that names the source issue or regression, covers the expected safe behavior, and preserves the original protected facts. Prefer one fixture per defect. Use `.txt` for plain prose and `.md` when Markdown structure is relevant.

Fixtures must be deterministic and self-contained: never include secrets, personally identifiable information, network dependencies, or provider credentials.
