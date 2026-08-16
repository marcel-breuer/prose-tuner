/**
 * Public entry point for ProseTuner's provider-independent core.
 *
 * Domain capabilities are introduced incrementally in subsequent milestones.
 */
export const VERSION = '0.1.0';

export * from './analyzer/index.js';
export * from './integrity/index.js';
export * from './modes/index.js';
export * from './language/index.js';
export * from './parser/index.js';
export * from './rewrite/index.js';
