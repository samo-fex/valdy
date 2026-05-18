// Agent Console Orchestrator Types

export enum AgentAction {
  GENERATE_PROBLEM = 'GENERATE_PROBLEM',
  GENERATE_SOLUTION = 'GENERATE_SOLUTION',
  GENERATE_REQUIREMENT = 'GENERATE_REQUIREMENT', 
  RESEARCH_CARD = 'RESEARCH_CARD',
  GENERATE_PRD = 'GENERATE_PRD',
  THINK = 'THINK',
  WAIT = 'WAIT'
}

export interface Source {
  url: string
  title: string
  snippet: string
  relevanceScore: number
}

export interface Card {
  id: string
  type: 'problem' | 'solution' | 'requirement'
  text: string
  confidence: number              // 0-100
  state: 'hypothesis' | 'validated' | 'fact' | 'rejected'    // fact when confidence >= 85%
  sources: Source[]               // Web sources from research
  parentId?: string               // For solutions/requirements
  createdAt: number
  researchedAt?: number
}

export interface PipelineStats {
  validatedProblems: number      // confidence >= 85%
  validatedSolutions: number     // confidence >= 85%
  validatedRequirements: number  // confidence >= 85%
  totalCards: number
  avgProblemConfidence: number
  avgSolutionConfidence: number
  avgRequirementConfidence: number
  researchProgress: number       // % cards with confidence > 0
}

export interface PipelineState {
  stage: string
  canGeneratePRD: boolean       // 3+ problems, 3+ solutions, 15+ requirements
  blockers: string[]            // What prevents progression
  lastAction: AgentAction
  lastActionTime: number
}

export interface AgentContext {
  // Card Collections
  problems: Card[]
  solutions: Card[]
  requirements: Card[]
  
  // Pipeline Statistics (derived from cards)
  stats: PipelineStats
  
  // Pipeline State
  pipeline: PipelineState
  
  // Metadata
  niche: string
  timestamp: number
}

export interface AgentActionResult {
  action: AgentAction
  parameters?: {
    cardId?: string
    problemId?: string
    solutionId?: string
    requirementType?: 'functional' | 'non-functional'
  }
  reasoning: string
  confidence: number
}
