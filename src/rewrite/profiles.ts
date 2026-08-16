import type {
  ResolvedRewriteProfile,
  RewriteIntensity,
  RewriteProfileOptions,
  RewriteStyle,
} from './types.js';

interface StylePreset {
  readonly focus: readonly string[];
  readonly preservation: readonly string[];
}

const BASE = [
  'Perform editorial refinement only.',
  'Preserve meaning, facts, qualifiers, citations, quotations, terminology, and provenance.',
  'Do not add claims, sources, or unsupported details.',
  'Do not optimize for detector scores or conceal authorship.',
] as const;

const PRESETS: Readonly<Record<RewriteStyle, StylePreset>> = {
  neutral: { focus: ['Use clear, direct prose with a natural rhythm.'], preservation: [] },
  professional: {
    focus: ['Use precise, polished language for a professional audience.'],
    preservation: ['Retain the intended level of formality.'],
  },
  academic: {
    focus: ['Use disciplined, readable academic prose.'],
    preservation: ['Preserve formal terminology and citation context.'],
  },
  technical: {
    focus: ['Prioritize precision, clarity, and concise technical explanations.'],
    preservation: ['Preserve technical terminology and operational detail.'],
  },
  blog: {
    focus: ['Use engaging, accessible prose with varied sentence rhythm.'],
    preservation: ['Retain the intended audience and subject-matter terms.'],
  },
  concise: {
    focus: ['Remove unnecessary wording while retaining all semantic content.'],
    preservation: ['Do not omit qualifications or explanatory steps needed for accuracy.'],
  },
  conversational: {
    focus: ['Use approachable, natural language without becoming informal by default.'],
    preservation: ['Retain professional or domain-specific terminology where needed.'],
  },
};

const INTENSITIES: Readonly<Record<RewriteIntensity, readonly string[]>> = {
  light: ['Prefer small wording and transition refinements.'],
  balanced: ['Improve wording, sentence flow, and local structure where useful.'],
  strong: [
    'May restructure sentences and paragraphs for clarity.',
    'Do not alter semantic claims, qualifications, or factual relationships.',
  ],
};

export function resolveRewriteProfile(options: RewriteProfileOptions = {}): ResolvedRewriteProfile {
  const style = options.style ?? 'neutral';
  const intensity = options.intensity ?? 'balanced';
  const preset = PRESETS[style];
  return {
    instructions: [...BASE, ...preset.focus, ...preset.preservation, ...INTENSITIES[intensity]],
    intensity,
    style,
  };
}
