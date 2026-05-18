import { EngineState } from '@/src/types/project'
import { AgentContext, Card, PipelineStats, PipelineState, AgentAction, Source } from '@/src/types/orchestrator'
import { getHypothesisState } from '@/src/lib/scoring/schemas'

/**
 * Builds AgentContext from current EngineState
 * Transforms hypotheses into Card format and calculates pipeline statistics
 */
export function buildAgentContext(state: EngineState): AgentContext {
  // Convert string sources to Source objects
  const convertSources = (sources: string[] = []): Source[] => {
    return sources.map(source => {
      const parts = source.split('|||')
      return {
        url: parts[0] || '',
        title: parts[1] || '',
        snippet: parts[2] || '',
        relevanceScore: 0.8
      }
    })
  }

  // Convert hypotheses to Card format
  const problems: Card[] = state.hypotheses.map(h => ({
    id: h.id,
    type: 'problem' as const,
    text: h.text,
    confidence: h.confidence || 0,
    state: getHypothesisState(h.confidence || 0),
    sources: convertSources(h.sources),
    createdAt: h.createdAt.getTime(),
    researchedAt: h.confidence ? Date.now() : undefined
  }))

  const solutions: Card[] = state.solutions.map(s => ({
    id: s.id,
    type: 'solution' as const,
    text: s.text,
    confidence: s.confidence || 0,
    state: getHypothesisState(s.confidence || 0),
    sources: convertSources(s.sources),
    parentId: s.parentProblemId,
    createdAt: s.createdAt.getTime(),
    researchedAt: s.confidence ? Date.now() : undefined
  }))

  const requirements: Card[] = state.requirements.map(r => ({
    id: r.id,
    type: 'requirement' as const,
    text: r.text,
    confidence: r.confidence || 0,
    state: getHypothesisState(r.confidence || 0),
    sources: convertSources(r.sources),
    parentId: r.parentSolutionId,
    createdAt: r.createdAt.getTime(),
    researchedAt: r.confidence ? Date.now() : undefined
  }))

  // Calculate pipeline statistics
  const allCards = [...problems, ...solutions, ...requirements]
  const validatedProblems = problems.filter(p => p.confidence >= 85).length
  const validatedSolutions = solutions.filter(s => s.confidence >= 85).length
  const validatedRequirements = requirements.filter(r => r.confidence >= 85).length
  
  const avgProblemConfidence = problems.length > 0 
    ? problems.reduce((sum, p) => sum + p.confidence, 0) / problems.length 
    : 0
  
  const avgSolutionConfidence = solutions.length > 0
    ? solutions.reduce((sum, s) => sum + s.confidence, 0) / solutions.length
    : 0
  
  const avgRequirementConfidence = requirements.length > 0
    ? requirements.reduce((sum, r) => sum + r.confidence, 0) / requirements.length
    : 0
  
  const researchedCards = allCards.filter(c => c.confidence > 0).length
  const researchProgress = allCards.length > 0 ? researchedCards / allCards.length : 0

  const stats: PipelineStats = {
    validatedProblems,
    validatedSolutions,
    validatedRequirements,
    totalCards: allCards.length,
    avgProblemConfidence,
    avgSolutionConfidence,
    avgRequirementConfidence,
    researchProgress
  }

  // Determine pipeline state
  const canGeneratePRD = validatedProblems >= 3 && validatedSolutions >= 3 && validatedRequirements >= 15
  
  const blockers: string[] = []
  if (validatedProblems < 3) blockers.push(`Need ${3 - validatedProblems} more validated problems`)
  if (validatedSolutions < 3) blockers.push(`Need ${3 - validatedSolutions} more validated solutions`)
  if (validatedRequirements < 15) blockers.push(`Need ${15 - validatedRequirements} more validated requirements`)

  const pipeline: PipelineState = {
    stage: 'hypothesis', // Default stage
    canGeneratePRD,
    blockers,
    lastAction: AgentAction.WAIT,
    lastActionTime: Date.now()
  }

  return {
    problems,
    solutions,
    requirements,
    stats,
    pipeline,
    niche: state.niche || '',
    timestamp: Date.now()
  }
}
