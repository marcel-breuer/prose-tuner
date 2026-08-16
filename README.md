# ProseTuner

ProseTuner is a provenance-safe editorial refinement core for German and English plain text and Markdown. It finds style issues deterministically, separates editable prose from protected content, and validates a rewrite before returning it.

It is designed for editors and coding-agent workflows that need traceable guardrails around an injected rewrite provider. It is not an AI detector, a detector-bypass tool, a watermark remover, or an authorship-concealment tool.

## What it protects

The pipeline preserves Markdown structure, links, inline and fenced code, quotations, URLs, DOIs, citations, ISBNs, footnotes, numbers, currencies, dates, and configured terminology. It also checks semantic risk markers such as negation, modality, causality, probability, responsibility, and legal qualifiers. When a check fails or is uncertain, it keeps the affected original text; an integrity failure returns the complete original document.

No full document is persisted or logged by the core. ProseTuner does not add facts, citations, or unsupported claims.

## Architecture

| Layer                        | Responsibility                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`SKILL.md`](SKILL.md)       | Editorial contract for Codex and other agents: supported work, mandatory safe workflow, and non-negotiable boundaries. |
| `src/parser`                 | Lossless Markdown/plain-text segmentation into editable, structural, and protected spans.                              |
| `src/analyzer`               | Deterministic style analysis and JSON/Markdown reports.                                                                |
| `src/rewrite`                | Provider-independent rewrite pipeline, profiles, retries, and timeouts.                                                |
| `src/integrity`              | Token and semantic validation with fail-safe fallback.                                                                 |
| `src/modes` and `src/cli.ts` | Analyze, rewrite, and review orchestration plus the local command interface.                                           |

The skill is the behavioral contract; TypeScript supplies deterministic parsing, validation, configuration, tests, and a vendor-neutral provider boundary.

## Install and verify

Prerequisites: Node.js 24 or later and npm. The repository's CI uses the same runtime.

```bash
git clone https://github.com/marcel-breuer/prose-tuner.git
cd prose-tuner
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

For the complete release-readiness check, including a dry-run package, run:

```bash
npm run release:check
```

## Agent Skill usage

Give a compatible agent the repository-local [`SKILL.md`](SKILL.md) and its linked references before it uses a rewrite path. The skill requires this sequence:

1. Preserve input provenance and parse it losslessly.
2. Analyze editorial characteristics without making authorship or detector claims.
3. Rewrite only editable prose with an explicit style and intensity.
4. Restore protected segments and run token and semantic validation.
5. Retain original text when validation fails or is uncertain.

The skill prohibits watermark removal, detector bypass, detector-score optimization, and false authorship claims.

## CLI

Build first, then analyze a file or standard input:

```bash
node dist/cli.js article.md --mode analyze --language en-US
printf 'However, this is very very clear.' | node dist/cli.js --mode analyze --style concise
```

`analyze` writes a deterministic JSON report with a language decision, metrics, and editorial findings. The output has this stable shape:

```json
{
  "version": 1,
  "language": { "code": "en-US", "source": "explicit" },
  "metrics": { "averageSentenceLength": 6 },
  "findings": []
}
```

Available options are `--mode analyze|rewrite|review`, `--style`, `--intensity`, `--language`, and `--config`. Run `node dist/cli.js --help` for the complete list.

The shipped CLI intentionally has no provider credentials or provider SDK. Therefore `rewrite` and `review` report a clear configuration error until an application injects a `RewriteProvider`. This avoids silently sending text to an external service.

## Library rewrite and review modes

`rewrite` returns only the validated text. `review` additionally returns factual counts of applied and rejected segments. Connect any approved provider through the small `RewriteProvider` interface:

```ts
import { executeMode, type RewriteProvider } from 'prose-tuner';

const provider: RewriteProvider = {
  name: 'approved-editorial-provider',
  async rewrite({ text }) {
    return { text: await refineWithYourApprovedService(text) };
  },
};

const result = await executeMode('Dieser Abschnitt ist sehr sehr ausführlich.', 'review', {
  language: 'de-DE',
  style: 'professional',
  intensity: 'balanced',
  protectedTerms: [{ value: 'ProseTuner Core' }],
  provider,
});
```

Provider code is responsible for consent, credentials, data handling, and any network access. The core has no bundled paid or external provider.

## Configuration

Create `.prosetuner.yml` in the working directory or any parent directory. Command-line options override this file.

```yaml
language: auto # auto, de-DE, en-US, en-GB
style: professional # neutral, professional, academic, technical, blog, concise, conversational
intensity: balanced # light, balanced, strong
preserveStructure: true
protect:
  - ProseTuner Core
  - value: OpenAI API
    caseSensitive: false
analyzers:
  repetition: true
  filler: true
  transitions: true
  metaCommentary: true
  sentenceStructure: true
  headingDensity: true
  paragraphLength: true
  germanNominalStyle: true
  lexicalRedundancy: true
```

Unknown fields and prohibited capability requests fail validation. `preserveStructure` defaults to `true`; all analyzers default to `true`.

## Supported languages, styles, and intensities

- Languages: automatic detection, `de-DE`, `en-US`, `en-GB`. Rewriting stops safely when the language cannot be determined and no explicit supported locale is supplied.
- Modes: `analyze` (no provider call), `rewrite` (validated revised text), `review` (validated text plus change report).
- Styles: `neutral`, `professional`, `academic`, `technical`, `blog`, `concise`, `conversational`.
- Intensities: `light`, `balanced` (default), `strong`.

## Before and after

English plain text:

```text
Before: This is very very verbose prose. The team can use it to explain the plan.
After:  This is concise prose. The team can use it to explain the plan.
```

German Markdown prose while protected content remains identical:

```md
Before: Dieser Abschnitt ist sehr sehr ausführlich. Die Kennzahl beträgt 50 %.
After: Dieser Abschnitt ist knapp. Die Kennzahl beträgt 50 %.
```

The corresponding plain-English and complex German Markdown inputs, including citations, URLs, a currency, a date, quotes, terminology, links, and code, are exercised in [`tests/fixtures`](tests/fixtures). The review-result snapshot and integrity-corruption tests make those examples regression coverage rather than illustrative promises.

## Contributing

For a style rule, add a deterministic analyzer implementation, a focused unit test, and report coverage when it changes a public finding. Never add detector, watermark-removal, or authorship-scoring behavior.

For a bug, add the smallest self-contained fixture following the [`tests/fixtures` convention](tests/fixtures/README.md), then add a colocated regression test that captures the expected safe behavior. Use `.txt` for plain prose and `.md` for structure-sensitive inputs; never put secrets, credentials, network dependencies, or personal data in a fixture.

Run `npm run release:check` before proposing a versioned release. Pull requests receive the same format, lint, typecheck, test, and build checks in GitHub Actions.

## License

[MIT](LICENSE)
