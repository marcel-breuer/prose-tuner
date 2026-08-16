export const PROHIBITED_CAPABILITIES = [
  'remove-watermark',
  'strip-provenance',
  'bypass-detector',
  'human-score',
  'ai-score',
  'detector-score',
] as const;

export class UnsupportedCapabilityError extends Error {
  public constructor(public readonly capability: string) {
    super(
      `Unsupported capability: ${capability}. ProseTuner supports provenance-safe editorial refinement only.`,
    );
    this.name = 'UnsupportedCapabilityError';
  }
}

export function assertNoProhibitedOptions(input: unknown): void {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return;
  for (const [key, value] of Object.entries(input)) {
    assertSupportedOption(key);
    assertNoProhibitedOptions(value);
  }
}

export function assertSupportedOption(option: string): void {
  const normalized = option.toLocaleLowerCase().replace(/_/g, '-');
  if ((PROHIBITED_CAPABILITIES as readonly string[]).includes(normalized))
    throw new UnsupportedCapabilityError(option);
}
