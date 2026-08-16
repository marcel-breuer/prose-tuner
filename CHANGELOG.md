# Changelog

## 0.1.0 — 2026-08-16

First MVP release of ProseTuner, a provenance-safe editorial refinement core for German and English plain text and Markdown.

### Included

- Repository-local Agent Skill contract for safe editorial workflows.
- Lossless parsing that separates editable prose from Markdown structure and protected content.
- Deterministic style analysis and structured analysis reports.
- Provider-independent rewrite interface with style presets and light, balanced, and strong intensities.
- Token and semantic integrity validation with fail-safe fallback to original text.
- Analyze, rewrite, and review library modes, project configuration, and a local analyze CLI.
- Regression fixtures, deterministic tests, and Node.js 24 GitHub Actions validation.

### Limitations

- The shipped CLI performs local analysis only. Rewrite and review require an application to explicitly inject an approved `RewriteProvider`; no provider credential or SDK is bundled.
- Automatic language detection supports German and English only. Rewriting stops safely if no supported language can be resolved.
- Semantic validation is conservative and uses deterministic risk markers; uncertain results retain the original affected text.

### Non-goals

- Removing provenance markers or watermarks.
- Bypassing, optimizing for, or scoring AI detectors.
- Faking or concealing authorship.
- Adding unsupported facts or citations.
