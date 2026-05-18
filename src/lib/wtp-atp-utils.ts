import { HypothesisCheck, HypothesisState } from '@/src/types/project';
import { getHypothesisState } from '@/src/lib/scoring/schemas';

// Re-export from the single source of truth in scoring/schemas
export { getHypothesisState } from '@/src/lib/scoring/schemas';

/**
 * Calculate combined WTP/ATP score using the formula: (wtp * 0.6) + (atp * 0.4)
 */
export function calculateCombinedScore(wtp: number, atp: number): number {
  return Math.round((wtp * 0.6) + (atp * 0.4));
}

/**
 * Process WTP/ATP validation result into confidence score and state
 */
export function processValidationResult(check: HypothesisCheck): {
  confidence: number;
  state: HypothesisState;
} {
  const combinedScore = calculateCombinedScore(check.wtp, check.atp);
  const state = getHypothesisState(combinedScore);

  return {
    confidence: combinedScore,
    state
  };
}
