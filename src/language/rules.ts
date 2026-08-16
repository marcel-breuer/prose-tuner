import type { LanguageRuleRegistry, SupportedLanguage } from './types.js';

const germanRules: LanguageRuleRegistry = {
  language: 'de-DE',
  family: 'german',
  transitions: ['außerdem', 'darüber hinaus', 'jedoch', 'folglich', 'insbesondere', 'zunächst'],
  metaPhrases: [
    'es ist wichtig zu beachten',
    'an dieser stelle',
    'zusammenfassend lässt sich sagen',
    'wie bereits erwähnt',
  ],
  fillerAndIntensifiers: ['sehr', 'wirklich', 'eigentlich', 'grundsätzlich', 'durchaus', 'relativ'],
  heuristics: {
    nominalizationSuffixes: ['ung', 'keit', 'heit', 'schaft', 'ismus', 'tion'],
    redundancyPairs: [
      ['vollständig', 'komplett'],
      ['jeweils', 'einzeln'],
      ['zukünftig', 'in zukunft'],
    ],
  },
};

const englishRules: Omit<LanguageRuleRegistry, 'language'> = {
  family: 'english',
  transitions: ['additionally', 'however', 'moreover', 'therefore', 'furthermore', 'consequently'],
  metaPhrases: [
    'it is important to note',
    'it should be noted that',
    'in conclusion',
    'as mentioned above',
  ],
  fillerAndIntensifiers: ['very', 'really', 'quite', 'basically', 'actually', 'clearly'],
  heuristics: {
    nominalizationSuffixes: ['tion', 'ment', 'ness', 'ity', 'ance', 'ence'],
    redundancyPairs: [
      ['future', 'plans'],
      ['each', 'individual'],
      ['completely', 'finished'],
    ],
  },
};

export const LANGUAGE_RULES: Readonly<Record<SupportedLanguage, LanguageRuleRegistry>> = {
  'de-DE': germanRules,
  'en-US': { language: 'en-US', ...englishRules },
  'en-GB': { language: 'en-GB', ...englishRules },
};

export function getRuleRegistry(language: SupportedLanguage): LanguageRuleRegistry {
  return LANGUAGE_RULES[language];
}
