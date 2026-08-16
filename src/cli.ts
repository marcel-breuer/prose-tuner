import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createAnalysisReport, serializeAnalysisReport } from './analyzer/index.js';
import { loadProjectConfig } from './config/index.js';
import type { ProseTunerConfigInput } from './config/index.js';
import type { ProseTunerMode } from './modes/index.js';

export interface CliIo {
  readonly cwd: string;
  readonly readStdin: () => Promise<string>;
  readonly writeError: (value: string) => void;
  readonly writeOutput: (value: string) => void;
}
export class CliError extends Error {
  public constructor(
    message: string,
    public readonly exitCode = 2,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export async function runCli(args: readonly string[], io: CliIo): Promise<number> {
  try {
    const parsed = parseArguments(args);
    if (parsed.help) {
      io.writeOutput(helpText());
      return 0;
    }
    const loaded = await loadProjectConfig({
      cwd: io.cwd,
      ...(parsed.config === undefined ? {} : { filePath: parsed.config }),
      overrides: parsed.overrides,
    });
    const input =
      parsed.inputPath === undefined
        ? await io.readStdin()
        : await readFile(parsed.inputPath, 'utf8');
    if (parsed.mode === 'analyze') {
      io.writeOutput(
        `${serializeAnalysisReport(createAnalysisReport(input, { language: loaded.config.language }))}\n`,
      );
      return 0;
    }
    throw new CliError(
      'Rewrite and review require an explicitly configured RewriteProvider; no provider is bundled with the CLI.',
      3,
    );
  } catch (error) {
    io.writeError(
      `prosetuner: ${error instanceof Error ? error.message : 'Unexpected CLI failure.'}\n`,
    );
    return error instanceof CliError ? error.exitCode : 2;
  }
}

function parseArguments(args: readonly string[]): {
  readonly config: string | undefined;
  readonly help: boolean;
  readonly inputPath: string | undefined;
  readonly mode: ProseTunerMode;
  readonly overrides: ProseTunerConfigInput;
} {
  let config: string | undefined;
  let help = false;
  let inputPath: string | undefined;
  let mode: ProseTunerMode = 'analyze';
  const overrides: ProseTunerConfigInput = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') {
      help = true;
      continue;
    }
    if (!argument?.startsWith('--')) {
      if (inputPath !== undefined) throw new CliError('Only one input file may be supplied.');
      inputPath = argument;
      continue;
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith('--'))
      throw new CliError(`Missing value for ${argument}.`);
    index += 1;
    if (argument === '--config') config = value;
    else if (argument === '--mode') {
      if (!['analyze', 'rewrite', 'review'].includes(value))
        throw new CliError('Mode must be analyze, rewrite, or review.');
      mode = value as ProseTunerMode;
    } else if (argument === '--style') overrides.style = value as ProseTunerConfigInput['style'];
    else if (argument === '--intensity')
      overrides.intensity = value as ProseTunerConfigInput['intensity'];
    else if (argument === '--language')
      overrides.language = value as ProseTunerConfigInput['language'];
    else throw new CliError(`Unknown option: ${argument}.`);
  }
  return { config, help, inputPath, mode, overrides };
}
function helpText(): string {
  return `Usage: prosetuner [input.md] [options]\n\nOptions:\n  --mode analyze|rewrite|review\n  --style STYLE\n  --intensity LEVEL\n  --language LOCALE\n  --config PATH\n  -h, --help\n`;
}
if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1])
  void runCli(process.argv.slice(2), {
    cwd: process.cwd(),
    readStdin: async () => {
      let value = '';
      for await (const chunk of process.stdin) value += chunk;
      return value;
    },
    writeError: (value) => process.stderr.write(value),
    writeOutput: (value) => process.stdout.write(value),
  }).then((code) => {
    process.exitCode = code;
  });
