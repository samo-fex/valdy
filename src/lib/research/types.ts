export enum PipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface EngineInput {
  idea: string;
  niche: string;
  previousResults: EngineResult[];
}

export interface EngineResult {
  engineName: string;
  confidence?: number;
  findings: string[];
  data: any;
  tokensUsed: number;
}

export interface PipelineResult {
  researchId: string;
  status: PipelineStatus;
  currentEngine: number;
  results: EngineResult[];
  finalScore?: number;
}
