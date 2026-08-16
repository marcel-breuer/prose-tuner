export type GermanLanguage = 'de-DE';
export type EnglishLanguage = 'en-US' | 'en-GB';
export type SupportedLanguage = GermanLanguage | EnglishLanguage;
export type LanguagePreference = SupportedLanguage | 'auto';
export type LanguageFamily = 'german' | 'english';

export interface StylisticHeuristics {
  readonly nominalizationSuffixes: readonly string[];
  readonly redundancyPairs: readonly (readonly [string, string])[];
}

export interface LanguageRuleRegistry {
  readonly language: SupportedLanguage;
  readonly family: LanguageFamily;
  readonly transitions: readonly string[];
  readonly metaPhrases: readonly string[];
  readonly fillerAndIntensifiers: readonly string[];
  readonly heuristics: StylisticHeuristics;
}

export interface LanguageScores {
  readonly english: number;
  readonly german: number;
}

export interface LanguageDetection {
  readonly confidence: 'high' | 'low';
  readonly language: SupportedLanguage | undefined;
  readonly scores: LanguageScores;
}

export interface ResolveLanguageOptions {
  readonly englishVariant?: EnglishLanguage;
  readonly language?: LanguagePreference;
  readonly text: string;
}

export interface LanguageResolution {
  readonly confidence: 'high' | 'low';
  readonly language: SupportedLanguage | undefined;
  readonly registry: LanguageRuleRegistry | undefined;
  readonly scores: LanguageScores;
  readonly source: 'explicit' | 'detected' | 'ambiguous';
}
