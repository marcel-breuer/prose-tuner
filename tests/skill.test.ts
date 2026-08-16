import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const skillUrl = new URL('../SKILL.md', import.meta.url);

describe('Agent Skill manifest', () => {
  it('declares provenance-safe editorial refinement', async () => {
    const skill = await readFile(skillUrl, 'utf8');

    expect(skill).toMatch(/^---\nname: prose-tuner\n/);
    expect(skill).toContain('editorial refinement');
    expect(skill).toContain('`analyze`');
    expect(skill).toContain('`rewrite`');
    expect(skill).toContain('`review`');
    expect(skill).toContain('Never remove watermarks or provenance markers');
    expect(skill).toContain('references/integrity.md');
  });
});
