export const GATES = {
  HYPOTHESIS: { threshold: 90, minCount: 2 },
  PROBLEM_QUALITY: { threshold: 70 },
  SOLUTION_QUALITY: { threshold: 70 },
  REQUIREMENTS: { threshold: 75 },
  PRD: { threshold: 80 },
  DNA: { threshold: 85 },
} as const;

export type Stage = keyof typeof GATES;

export const STAGE_ORDER: Stage[] = [
  'HYPOTHESIS',
  'PROBLEM_QUALITY',
  'SOLUTION_QUALITY',
  'REQUIREMENTS',
  'PRD',
  'DNA',
];

export function canProgress(stage: Stage, score: number, count?: number): boolean {
  const gate = GATES[stage];
  if ('minCount' in gate && count !== undefined) {
    return score >= gate.threshold && count >= gate.minCount;
  }
  return score >= gate.threshold;
}

export function getNextStage(current: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export function getGateStatus(stage: Stage, score: number, count?: number): {
  passed: boolean;
  threshold: number;
  gap: number;
} {
  const gate = GATES[stage];
  const passed = canProgress(stage, score, count);
  return {
    passed,
    threshold: gate.threshold,
    gap: passed ? 0 : gate.threshold - score,
  };
}
