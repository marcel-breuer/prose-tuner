import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigValidationError, loadProjectConfig, resolveConfig } from '../../src/config/index.js';

describe('project configuration', () => {
  it('resolves safe defaults without a configuration file', () => {
    expect(resolveConfig()).toMatchObject({
      language: 'auto',
      style: 'neutral',
      intensity: 'balanced',
      preserveStructure: true,
      protect: [],
    });
  });

  it('discovers config and applies runtime overrides predictably', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'prose-tuner-'));
    try {
      await writeFile(
        join(directory, '.prosetuner.yml'),
        'language: de-DE\nstyle: academic\nanalyzers:\n  filler: false\nprotect:\n  - Art. 50 AI Act\n',
      );
      const result = await loadProjectConfig({
        cwd: join(directory, 'nested'),
        overrides: { style: 'technical', analyzers: { transitions: false } },
      });
      expect(result.config).toMatchObject({
        language: 'de-DE',
        style: 'technical',
        analyzers: { filler: false, transitions: false },
        protect: [{ value: 'Art. 50 AI Act', caseSensitive: true }],
      });
      expect(result.path).toBe(join(directory, '.prosetuner.yml'));
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it('rejects unknown values and malformed protect lists clearly', () => {
    expect(() => resolveConfig({ style: 'casual' })).toThrow(ConfigValidationError);
    expect(() => resolveConfig({ unknown: true })).toThrow('Invalid ProseTuner configuration');
    expect(() => resolveConfig({ protect: [{ value: '' }] })).toThrow(ConfigValidationError);
  });
});
