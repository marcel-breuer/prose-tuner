import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';

function io(stdin = '') {
  const output: string[] = [];
  const error: string[] = [];
  return {
    cwd: process.cwd(),
    error,
    output,
    readStdin: async () => stdin,
    writeError: (value: string) => error.push(value),
    writeOutput: (value: string) => output.push(value),
  };
}
describe('CLI', () => {
  it('analyzes file and stdin input', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'prosetuner-cli-'));
    try {
      const path = join(directory, 'input.md');
      await writeFile(path, 'A concise sentence.');
      const fileIo = io();
      expect(await runCli([path], fileIo)).toBe(0);
      expect(fileIo.output.join('')).toContain('"version": 1');
      const stdinIo = io('Another sentence.');
      expect(await runCli(['--mode', 'analyze'], stdinIo)).toBe(0);
      expect(stdinIo.output.join('')).toContain('"metrics"');
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
  it('documents flags and returns safe errors', async () => {
    const helpIo = io();
    expect(await runCli(['--help'], helpIo)).toBe(0);
    expect(helpIo.output.join('')).toContain('--config PATH');
    const errorIo = io('private input');
    expect(await runCli(['--mode', 'invalid'], errorIo)).toBe(2);
    expect(errorIo.error.join('')).toContain('Mode must be');
    expect(errorIo.error.join('')).not.toContain('private input');
  });
});
