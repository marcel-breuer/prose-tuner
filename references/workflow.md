# ProseTuner workflow reference

## Input handling

Accept plain text and Markdown. Keep supplied metadata associated with the input throughout execution. Treat headings, lists, links, inline code, fenced code blocks, quotations, citations, URLs, and identifiers as structure or protected content rather than editable prose.

## Editorial analysis

Report deterministic, editorial findings such as repeated transitions, repeated sentence openings, filler phrases, unnecessary meta-language, sentence-length monotony, heading density, and nominal-style candidates. Findings describe text characteristics; they must not estimate AI use, human authorship, or detector likelihood.

## Rewrite behavior

Apply the selected style and intensity only to eligible prose. A stronger intensity may restructure sentences and paragraphs, but it must remain an editorial refinement and preserve semantic claims. `analyze` must not invoke a rewrite provider. `rewrite` returns clean revised text. `review` records only factual applied or rejected changes.

## Safe completion

Run token-level and semantic checks after rewriting. When protected content differs, meaning cannot be established, or validation is uncertain, keep the original affected content. Surface typed failures to callers without writing the full document to logs.
