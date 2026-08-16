import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const languages = ['auto', 'de-DE', 'en-US', 'en-GB'] as const;
const styles = [
  'neutral',
  'professional',
  'academic',
  'technical',
  'blog',
  'concise',
  'conversational',
] as const;
const intensities = ['light', 'balanced', 'strong'] as const;
const analyzerToggles = [
  'repetition',
  'transitions',
  'metaCommentary',
  'filler',
  'sentenceStructure',
  'headingDensity',
  'paragraphLength',
  'germanNominalStyle',
  'lexicalRedundancy',
] as const;
const protectedTermSchema = z
  .object({ caseSensitive: z.boolean().optional(), value: z.string().min(1) })
  .strict();
const inputSchema = z
  .object({
    analyzers: z
      .object(Object.fromEntries(analyzerToggles.map((toggle) => [toggle, z.boolean().optional()])))
      .strict()
      .optional(),
    intensity: z.enum(intensities).optional(),
    language: z.enum(languages).optional(),
    preserveStructure: z.boolean().optional(),
    protect: z.array(z.union([z.string().min(1), protectedTermSchema])).optional(),
    style: z.enum(styles).optional(),
  })
  .strict();

export type ProseTunerConfigInput = z.input<typeof inputSchema>;
export interface ProseTunerConfig {
  readonly analyzers: Readonly<Record<(typeof analyzerToggles)[number], boolean>>;
  readonly intensity: (typeof intensities)[number];
  readonly language: (typeof languages)[number];
  readonly preserveStructure: boolean;
  readonly protect: readonly { readonly caseSensitive: boolean; readonly value: string }[];
  readonly style: (typeof styles)[number];
}
export class ConfigValidationError extends Error {
  public constructor(public readonly issues: readonly string[]) {
    super(`Invalid ProseTuner configuration: ${issues.join('; ')}`);
    this.name = 'ConfigValidationError';
  }
}
export const DEFAULT_CONFIG: ProseTunerConfig = {
  analyzers: Object.fromEntries(
    analyzerToggles.map((toggle) => [toggle, true]),
  ) as ProseTunerConfig['analyzers'],
  intensity: 'balanced',
  language: 'auto',
  preserveStructure: true,
  protect: [],
  style: 'neutral',
};

export function resolveConfig(
  fileConfig: unknown = {},
  overrides: ProseTunerConfigInput = {},
): ProseTunerConfig {
  const parsedFile = parseInput(fileConfig);
  const parsedOverrides = parseInput(overrides);
  const input = {
    ...parsedFile,
    ...parsedOverrides,
    analyzers: { ...parsedFile.analyzers, ...parsedOverrides.analyzers },
  };
  return {
    analyzers: { ...DEFAULT_CONFIG.analyzers, ...input.analyzers },
    intensity: input.intensity ?? DEFAULT_CONFIG.intensity,
    language: input.language ?? DEFAULT_CONFIG.language,
    preserveStructure: input.preserveStructure ?? DEFAULT_CONFIG.preserveStructure,
    protect: (input.protect ?? DEFAULT_CONFIG.protect).map((term) =>
      typeof term === 'string'
        ? { caseSensitive: true, value: term }
        : { caseSensitive: term.caseSensitive ?? true, value: term.value },
    ),
    style: input.style ?? DEFAULT_CONFIG.style,
  };
}

export async function loadProjectConfig(options: {
  readonly cwd: string;
  readonly filePath?: string;
  readonly overrides?: ProseTunerConfigInput;
}): Promise<{ readonly config: ProseTunerConfig; readonly path: string | null }> {
  const path =
    options.filePath === undefined
      ? await findProjectConfig(options.cwd)
      : resolve(options.cwd, options.filePath);
  if (path === null) return { config: resolveConfig({}, options.overrides), path: null };
  try {
    return { config: resolveConfig(parse(await readFile(path, 'utf8')), options.overrides), path };
  } catch (error) {
    if (error instanceof ConfigValidationError) throw error;
    throw new ConfigValidationError(['Unable to parse .prosetuner.yml.']);
  }
}

async function findProjectConfig(cwd: string): Promise<string | null> {
  let directory = resolve(cwd);
  while (true) {
    const path = join(directory, '.prosetuner.yml');
    try {
      await access(path);
      return path;
    } catch {
      /* Continue toward the filesystem root. */
    }
    const parent = dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

function parseInput(input: unknown): ProseTunerConfigInput {
  const result = inputSchema.safeParse(input);
  if (result.success) return result.data;
  throw new ConfigValidationError(
    result.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`),
  );
}
