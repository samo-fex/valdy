import { useMemo } from 'react';
import { Hypothesis } from '@/src/types/project';
import { GATES, Stage, STAGE_ORDER, getGateStatus } from '@/src/lib/scoring';

interface ScoringInput {
  hypotheses: Hypothesis[];
  solutions: Hypothesis[];
  requirements: Hypothesis[];
}

export interface StageInfo {
  score: number;
  passed: boolean;
  threshold: number;
  gap: number;
  count?: number;
}

export function useScoring({ hypotheses, solutions, requirements }: ScoringInput) {
  return useMemo(() => {
    const problemFacts = hypotheses.filter(h => h.state === 'fact');
    const solutionFacts = solutions.filter(h => h.state === 'fact');
    const requirementFacts = requirements.filter(h => h.state === 'fact');
    const allFacts = [...problemFacts, ...solutionFacts];
    
    const avgConfidence = allFacts.length > 0
      ? allFacts.reduce((sum, h) => sum + h.confidence, 0) / allFacts.length
      : 0;
    
    const hypothesisGate = getGateStatus('HYPOTHESIS', avgConfidence, allFacts.length);
    
    // Determine current stage based on gates
    let currentStage: Stage = 'HYPOTHESIS';
    if (hypothesisGate.passed && problemFacts.length >= 2) currentStage = 'PROBLEM_QUALITY';
    if (problemFacts.length >= 2 && solutionFacts.length >= 2) currentStage = 'SOLUTION_QUALITY';
    if (problemFacts.length >= 2 && solutionFacts.length >= 2 && requirementFacts.length >= 2) currentStage = 'REQUIREMENTS';
    
    const stages: Record<Stage, StageInfo> = {
      HYPOTHESIS: { score: avgConfidence, count: allFacts.length, ...hypothesisGate },
      PROBLEM_QUALITY: { score: problemFacts.length >= 2 ? 75 : 0, passed: problemFacts.length >= 2, threshold: GATES.PROBLEM_QUALITY.threshold, gap: problemFacts.length >= 2 ? 0 : GATES.PROBLEM_QUALITY.threshold },
      SOLUTION_QUALITY: { score: solutionFacts.length >= 2 ? 75 : 0, passed: solutionFacts.length >= 2, threshold: GATES.SOLUTION_QUALITY.threshold, gap: solutionFacts.length >= 2 ? 0 : GATES.SOLUTION_QUALITY.threshold },
      REQUIREMENTS: { score: requirementFacts.length >= 2 ? 80 : 0, passed: requirementFacts.length >= 2, threshold: GATES.REQUIREMENTS.threshold, gap: requirementFacts.length >= 2 ? 0 : GATES.REQUIREMENTS.threshold },
      PRD: { score: 0, passed: false, threshold: GATES.PRD.threshold, gap: GATES.PRD.threshold },
      DNA: { score: 0, passed: false, threshold: GATES.DNA.threshold, gap: GATES.DNA.threshold },
    };
    
    const canCreateDNA = problemFacts.length >= 2 && solutionFacts.length >= 2 && requirementFacts.length >= 2;
    
    return { stages, currentStage, canCreateDNA };
  }, [hypotheses, solutions, requirements]);
}
