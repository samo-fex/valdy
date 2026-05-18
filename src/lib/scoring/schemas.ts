import { z } from 'zod';

// Base score (0-100)
const ScoreValue = z.number().min(0).max(100);

// Stage 1: Hypothesis-Fact Validation
export const HypothesisFactScoreSchema = z.object({
  confidence: ScoreValue,
  state: z.enum(['hypothesis', 'validated', 'fact', 'rejected']),
  type: z.enum(['problem', 'solution']),
  sources: z.array(z.string()).optional(),
});

// Stage 2: Problem Quality
export const ProblemQualitySchema = z.object({
  severity: ScoreValue,
  frequency: ScoreValue,
  marketSize: ScoreValue,
  urgency: ScoreValue,
  total: ScoreValue,
});

// Stage 3: Solution Quality
export const SolutionQualitySchema = z.object({
  feasibility: ScoreValue,
  differentiation: ScoreValue,
  scalability: ScoreValue,
  problemFit: ScoreValue,
  total: ScoreValue,
});

// Stage 4: Requirements Quality
export const FunctionalRequirementsSchema = z.object({
  completeness: ScoreValue,
  clarity: ScoreValue,
  testability: ScoreValue,
  total: ScoreValue,
});

export const NonFunctionalRequirementsSchema = z.object({
  performance: ScoreValue,
  security: ScoreValue,
  scalability: ScoreValue,
  reliability: ScoreValue,
  total: ScoreValue,
});

export const RequirementsQualitySchema = z.object({
  functional: FunctionalRequirementsSchema,
  nonFunctional: NonFunctionalRequirementsSchema,
  total: ScoreValue,
});

// Stage 5: PRD Quality
export const PRDQualitySchema = z.object({
  executiveSummary: ScoreValue,
  requirements: ScoreValue,
  metrics: ScoreValue,
  risks: ScoreValue,
  total: ScoreValue,
});

// Stage 6: DNA Quality (Composite)
export const DNAQualitySchema = z.object({
  hypothesisFactAvg: ScoreValue,
  problemQualityAvg: ScoreValue,
  solutionQualityAvg: ScoreValue,
  requirementsQuality: ScoreValue,
  prdQuality: ScoreValue,
  total: ScoreValue,
});

// Infer TypeScript types
export type HypothesisFactScore = z.infer<typeof HypothesisFactScoreSchema>;
export type ProblemQuality = z.infer<typeof ProblemQualitySchema>;
export type SolutionQuality = z.infer<typeof SolutionQualitySchema>;
export type FunctionalRequirements = z.infer<typeof FunctionalRequirementsSchema>;
export type NonFunctionalRequirements = z.infer<typeof NonFunctionalRequirementsSchema>;
export type RequirementsQuality = z.infer<typeof RequirementsQualitySchema>;
export type PRDQuality = z.infer<typeof PRDQualitySchema>;
export type DNAQuality = z.infer<typeof DNAQualitySchema>;

// Helper: Determine state from confidence using WTP/ATP thresholds
export function getHypothesisState(confidence: number): 'hypothesis' | 'validated' | 'fact' | 'rejected' {
  if (confidence >= 85) return 'fact';
  if (confidence >= 60) return 'validated';
  if (confidence >= 40) return 'hypothesis';
  return 'rejected';
}
