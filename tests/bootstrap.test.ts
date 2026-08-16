import { describe, expect, it } from 'vitest';

import { VERSION } from '../src/index.js';

describe('project bootstrap', () => {
  it('exposes the initial package version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
