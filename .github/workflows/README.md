# Automation workflows

`ci.yml` runs formatting, linting, type checking, tests, and the build for pull requests and `main`. `release-validation.yml` runs the complete release check for version tags and on demand.

All workflows use Node.js 24, `npm ci`, and the lockfile cache. They do not require a rewrite-provider credential because the test suite uses local deterministic mocks.
