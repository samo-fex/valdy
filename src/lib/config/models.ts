/**
 * SINGLE SOURCE OF TRUTH - All model configurations.
 * DO NOT hardcode model strings elsewhere.
 *
 * Position = priority. Swap any model ID at any position.
 * Import from this file to ensure consistency across the codebase.
 */

// App-wide fallback chain (validation, gaps, business plan, PRD, research)
export const FALLBACK_CHAIN = [
  'openai',          // Primary - fast (pollinations maps this to a good generalized model)
  'deepseek',        // Fallback 1
  'mistral'          // Fallback 2
] as const;

// AutoCoder-specific fallback chain (designer, decomposer, implementer)
export const AUTOCODER_FALLBACK_CHAIN = [
  'openai',
  'deepseek',
  'qwen'
] as const;

// Convenience exports (derived from position)
export const PRIMARY_MODEL = FALLBACK_CHAIN[0];
export const DEFAULT_MODEL = PRIMARY_MODEL;
