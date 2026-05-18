// Application constants
export const TIMING = {
  STREAMING_INTERVAL_MS: 8000, // Update rationale every 8 seconds
  HYPOTHESIS_GENERATION_INTERVAL_MS: 12000, // Generate hypothesis every 12 seconds
  RESEARCH_INTERVAL_MS: 15000, // Research hypothesis every 15 seconds
  RUNNING_TIME_UPDATE_MS: 1000, // Update running time every second
} as const;

export const LIMITS = {
  MAX_RATIONALE_ITEMS: 15, // Maximum rationale messages to display
  MAX_HYPOTHESES: 20, // Maximum hypotheses per column
  MAX_RETRIES: 3, // Maximum API retry attempts
  RATE_LIMIT_PER_MINUTE: 100, // API rate limit
} as const;

export const STORAGE_KEYS = {
  API_KEY: 'curatos_api_key',
  TOTAL_SPENT: 'curatos_total_spent',
  DNA: 'curatos_dna',
  SKIP_CONFIRMATION: 'skipRemovalConfirmation',
} as const;
