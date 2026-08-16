import { describe, expect, it } from 'vitest';
import { runCli } from '../../src/cli.js';
import {
  createAnalysisReport,
  resolveConfig,
  UnsupportedCapabilityError,
} from '../../src/index.js';

describe('provenance guardrails', () => {
  it('rejects prohibited configuration keys and aliases', () => {
    expect(() => resolveConfig({ 'remove-watermark': true })).toThrow(UnsupportedCapabilityError);
    expect(() => resolveConfig({ strip_provenance: true })).toThrow(UnsupportedCapabilityError);
  });

  it('rejects prohibited CLI options with a clear capability error', async () => {
    const errors: string[] = [];
    const code = await runCli(['--bypass-detector', 'true'], {
      cwd: process.cwd(),
      readStdin: async () => 'private input',
      writeError: (value) => errors.push(value),
      writeOutput: () => undefined,
    });
    expect(code).toBe(2);
    expect(errors.join('')).toContain('Unsupported capability: bypass-detector');
    expect(errors.join('')).not.toContain('private input');
  });

  it('keeps editorial reports free of detector-oriented scores', () => {
    const report = JSON.stringify(
      createAnalysisReport('A concise sentence.', { language: 'en-US' }),
    );
    expect(report).not.toMatch(/ai.?score|human.?score|detector.?score|probability/i);
  });
});
