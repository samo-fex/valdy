/**
 * SINGLE SOURCE OF TRUTH - All model configurations.
 * DO NOT hardcode model strings elsewhere.
 *
 * Position = priority. Swap any model ID at any position.
 * Import from this file to ensure consistency across the codebase.
 *
 * Routing: openai=general, perplexity-fast=search, deepseek=reasoning
 */

// App-wide fallback chain for general tasks
export const FALLBACK_CHAIN = [
  'openai',        // Primary - fast general model
  'deepseek',      // Fallback 1 - strong reasoning
  'mistral'        // Fallback 2 - fast instruction following
] as const;

// AutoCoder-specific fallback chain (designer, decomposer, implementer)
export const AUTOCODER_FALLBACK_CHAIN = [
  'openai',
  'deepseek',
  'qwen'
] as const;

// Search models for web-search tasks (use these for research/validation)
// These models have built-in web search capabilities
export const SEARCH_MODELS = {
  // Perplexity Sonar - fast with web search, best for factual/research queries
  perplexity: 'perplexity-fast',
  // Gemini with Google Search grounding - good alternative
  gemini: 'gemini-search',
} as const;

// Reasoning model for complex analysis tasks
export const REASONING_MODEL = 'deepseek' as const;

// Search fallback chain - use for research, validation, market analysis
export const SEARCH_FALLBACK_CHAIN = [
  SEARCH_MODELS.perplexity,
  SEARCH_MODELS.gemini,
] as const;

// Convenience exports
export const PRIMARY_MODEL = FALLBACK_CHAIN[0];
export const DEFAULT_MODEL = PRIMARY_MODEL;
export const PRIMARY_SEARCH_MODEL = SEARCH_MODELS.perplexity;
