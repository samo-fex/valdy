import { ProblemQuality, SolutionQuality, RequirementsQuality, PRDQuality, DNAQuality } from '@/src/lib/scoring';

export type HypothesisState = 'hypothesis' | 'validated' | 'fact' | 'rejected';
export type HypothesisStatus = 'pending' | 'downloading' | 'analyzing' | 'complete' | 'not_solvable' | 'researching';

export interface HypothesisCheck {
  wtp: number; // Willingness to Pay (0-100)
  atp: number; // Ability to Pay (0-100)
  reasoning: string; // Explanation of the scores
}

export interface Hypothesis {
  id: string;
  text: string;
  state: HypothesisState;
  status?: HypothesisStatus;
  confidence: number; // 0-100
  sources?: string[];
  type?: 'functional' | 'non-functional'; // For requirements column
  createdAt: Date;
  isFallback?: boolean; // Flag for fallback data when API fails
  // NEW: Chaining fields
  parentProblemId?: string;  // For solutions - links to the problem it solves
  parentSolutionId?: string; // For requirements - links to the solution
  solutionAttempts?: number; // Track retry count for problems (max 3)
}

export interface StageScores {
  hypothesis: { avgConfidence: number; factCount: number };
  problemQuality: ProblemQuality | null;
  solutionQuality: SolutionQuality | null;
  requirementsQuality: RequirementsQuality | null;
  prdQuality: PRDQuality | null;
  dnaQuality: DNAQuality | null;
}

export type StageName = 'HYPOTHESIS' | 'PROBLEM_QUALITY' | 'SOLUTION_QUALITY' | 'REQUIREMENTS' | 'PRD' | 'DNA';

export interface ChatMessage {
  role: 'user' | 'agent';
  message: string;
  timestamp: Date;
}

export interface DNAData {
  niche: string;
  generatedAt: Date;
  problems: Hypothesis[];
  solutions: Hypothesis[];
  requirements: Hypothesis[];
  tokenCost: number;
}

export interface EngineState {
  niche: string;
  nicheLocked: boolean;
  selectedRegions: string[];
  avoidedThemes: string[];
  autopilotEnabled: boolean;
  tokenBudget: number;
  tokensAvailable: number;
  tokensUsed: number;
  totalTokensSpent: number;
  tokenRate: number;
  hypotheses: Hypothesis[];
  solutions: Hypothesis[];
  requirements: Hypothesis[];
  slider: number; // 0-100, problems vs solutions focus
  problemsScore: number;
  solutionsScore: number;
  requirementsUnlocked: boolean;
  dnaUnlocked: boolean;
  generatedDNA: DNAData | null;
  agentRationale: string[];
  chatHistory: ChatMessage[];
  prdAssessed: boolean;
}
