/**
 * SINGLE SOURCE OF TRUTH - All model configurations.
 * DO NOT hardcode model strings elsewhere.
 *
 * Position = priority. Swap any model ID at any position.
 * Import from this file to ensure consistency across the codebase.
 */

// Pollinations.ai BYOP (Bring Your Own Pollen) - Available models
// Docs: https://gen.pollinations.ai/docs

// App-wide fallback chain for general tasks
export const FALLBACK_CHAIN = [
  'openai',          // Primary - fast general model
  'gemini-search',        // Fallback 1 - good reasoning
  'mistral'          // Fallback 2 - fast instruction following
] as const;

// AutoCoder-specific fallback chain (designer, decomposer, implementer)
export const AUTOCODER_FALLBACK_CHAIN = [
  'openai',
  'gemini-search',
  'qwen'
] as const;

// Search models for web-search tasks (use these for research/validation)
// These models have built-in web search capabilities
export const SEARCH_MODELS = {
  // Gemini with Google Search grounding - fast, good for factual queries
  gemini: 'gemini-search',
  // Perplexity Sonar - fast with web search
  perplexity: 'perplexity-fast',
} as const;

// Search fallback chain - use for research, validation, market analysis
export const SEARCH_FALLBACK_CHAIN = [
  SEARCH_MODELS.gemini,
  SEARCH_MODELS.perplexity,
] as const;

// Convenience exports
export const PRIMARY_MODEL = FALLBACK_CHAIN[0];
export const DEFAULT_MODEL = PRIMARY_MODEL;
export const PRIMARY_SEARCH_MODEL = SEARCH_MODELS.gemini;
