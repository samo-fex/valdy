import { getProvider, Message } from '@/src/lib/api';
import { getTokenTracker } from '@/src/lib/api/token-tracker';
import { ChatResponse } from '@/src/lib/api/types';
import { HypothesisCheck } from '@/src/types/project';
import { FALLBACK_CHAIN } from '@/src/lib/config/models';

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 10000;
const MIN_REQUEST_INTERVAL_MS = 15000;

let lastRequestTime = 0;

/**
 * Scoring criteria for hypothesis validation
 */
export const SCORING_CRITERIA = {
  PROBLEM: {
    MARKET_SIZE: {
      name: 'Market Size Evidence',
      weight: 25,
      description: 'TAM/SAM data, market research reports, industry size estimates',
    },
    PAIN_INTENSITY: {
      name: 'Pain Intensity',
      weight: 25,
      description: 'Customer complaints, support tickets, forum discussions, urgency signals',
    },
    EXISTING_SOLUTIONS: {
      name: 'Existing Solutions',
      weight: 25,
      description: 'Current competitors solving this (proves demand exists)',
    },
    WILLINGNESS_TO_PAY: {
      name: 'Willingness to Pay',
      weight: 25,
      description: 'Pricing data, revenue numbers, funding rounds, payment evidence',
    },
  },
  SOLUTION: {
    TECHNICAL_FEASIBILITY: {
      name: 'Technical Feasibility',
      weight: 25,
      description: 'Existing tech, APIs, proven approaches, implementation complexity',
    },
    COMPETITIVE_ADVANTAGE: {
      name: 'Competitive Advantage',
      weight: 25,
      description: 'Unique approach vs competitors, differentiation, moat potential',
    },
    TIME_TO_MARKET: {
      name: 'Time to Market',
      weight: 25,
      description: 'Development time, resource requirements, launch complexity',
    },
    MARKET_VALIDATION: {
      name: 'Market Validation',
      weight: 25,
      description: 'Similar products with traction, proven business models, success cases',
    },
  },
};

/**
 * WTP/ATP score interpretation with new thresholds
 */
export const CONFIDENCE_LEVELS = {
  REJECTED: { min: 0, max: 39, label: 'Rejected', color: 'red' },
  RESEARCHING: { min: 40, max: 59, label: 'Researching', color: 'yellow' },
  VALIDATED: { min: 60, max: 84, label: 'Validated', color: 'blue' },
  FACT: { min: 85, max: 100, label: 'Fact', color: 'green' },
};

export interface ScoringResult {
  confidence: number;
  breakdown: {
    criterion: string;
    score: number;
    evidence: string;
  }[];
  sources: string[];
  level: string;
}

/**
 * Repair malformed JSON by fixing common LLM output issues
 */
function repairJson(text: string): string {
  let json = text;
  // Remove markdown code blocks
  json = json.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  // Fix trailing commas before closing brackets
  json = json.replace(/,(\s*[}\]])/g, '$1');
  // Fix missing commas between objects/arrays
  json = json.replace(/}(\s*){/g, '},{');
  json = json.replace(/](\s*)\[/g, '],[');
  // Fix unquoted keys (simple cases)
  json = json.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
  return json;
}

/**
 * Throttle requests to respect rate limits
 */
async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const wait = MIN_REQUEST_INTERVAL_MS - elapsed;
    console.log(`[ScoringEngine] Throttling ${wait}ms before next request`);
    await new Promise(r => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();
}

export class ScoringEngine {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Chat with OpenRouter fallback routing - auto-tries models in sequence
   */
  private async chatWithRetry(
    provider: ReturnType<typeof getProvider>,
    messages: Message[]
  ): Promise<ChatResponse> {
    await throttle();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await provider.chat(messages, {
          models: [...FALLBACK_CHAIN],
          route: 'fallback'
        });
      } catch (error: any) {
        const is429 = error?.message?.includes('429') || error?.status === 429;
        
        if (!is429) throw error;
        
        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[ScoringEngine] Rate limited, retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw new Error('All validation models exhausted. Please try again later.');
  }

  /**
   * Score a problem hypothesis with structured criteria
   */
  async scoreProblem(hypothesis: string, niche: string): Promise<ScoringResult> {
    return this.scoreHypothesis(hypothesis, niche, 'PROBLEM');
  }

  /**
   * Score a solution hypothesis with structured criteria
   */
  async scoreSolution(hypothesis: string, niche: string): Promise<ScoringResult> {
    return this.scoreHypothesis(hypothesis, niche, 'SOLUTION');
  }

  /**
   * Core scoring logic with structured evaluation and API Machine Gun search
   */
  private async scoreHypothesis(
    hypothesis: string,
    niche: string,
    type: 'PROBLEM' | 'SOLUTION'
  ): Promise<ScoringResult> {
    const provider = getProvider('openrouter', this.apiKey);
    const criteria = SCORING_CRITERIA[type];

    // Fire API Machine Gun via server-side route to avoid CORS
    const searchQuery = `${hypothesis} ${niche} market research`;
    let sources: string[] = [];
    let searchContext = '\n\nNo results found from any source. Base analysis on general market knowledge.';
    
    try {
      const response = await fetch('/api/research/machine-gun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (response.ok) {
        const data = await response.json();
        sources = data.sources || [];
        if (data.stats?.totalResults > 0) {
          searchContext = `\n\nMULTI-SOURCE RESEARCH (${data.stats.successfulSources}/8 sources, ${data.stats.totalResults} results):\n${data.formatted}`;
        }
        console.log(`[ScoringEngine] API Machine Gun: ${sources.length} sources from ${data.stats?.successfulSources || 0} APIs`);
      }
    } catch (error) {
      console.error('[ScoringEngine] API Machine Gun failed:', error);
    }

    const systemPrompt = `You are a rigorous market research analyst. Evaluate hypotheses using structured criteria and the provided web search evidence.

CRITICAL: Be SKEPTICAL. Use the web search results as primary evidence. If search results are weak or irrelevant, score LOW.`;

    const criteriaText = Object.entries(criteria)
      .map(([key, c]) => `- ${c.name} (0-${c.weight} points): ${c.description}`)
      .join('\n');

    const userPrompt = `Research this ${type.toLowerCase()} hypothesis in the ${niche} market:
"${hypothesis}"

Use the web search evidence below to evaluate each criterion:

${criteriaText}

SCORING GUIDELINES:
- 0-10 points: No evidence or only aspirational content
- 11-15 points: Weak signals (blog posts, thought pieces)
- 16-20 points: Moderate evidence (some companies, discussions)
- 21-25 points: Strong evidence (proven market, revenue data, multiple players)

${searchContext}

Respond in JSON format:
{
  "breakdown": [
    {
      "criterion": "Market Size Evidence",
      "score": <0-25>,
      "evidence": "Specific evidence found with numbers/data"
    },
    ...
  ],
  "totalScore": <sum of all scores>,
  "summary": "Brief synthesis of findings"
}

REQUIREMENTS FOR HIGH SCORES:
- Market Size: Need actual TAM/SAM numbers or industry reports
- Pain Intensity: Need quantified complaints or support data
- Existing Solutions: Need companies with revenue/funding data
- Willingness to Pay: Need actual pricing or payment evidence

If you only find generic content, score LOW (0-15 per criterion).`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // Try with retry for rate limits (no web search suffix needed)
    const response = await this.chatWithRetry(provider, messages);

    // Track token usage
    const tracker = getTokenTracker();
    tracker.log({
      promptTokens: response.tokens.prompt,
      completionTokens: response.tokens.completion,
      totalTokens: response.tokens.total,
      model: response.model,
      timestamp: new Date(),
      operation: `scoring-engine-${type.toLowerCase()}`,
    });

    // Parse response with JSON repair
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse scoring results: Invalid response format');
    }

    let data;
    try {
      data = JSON.parse(jsonMatch[0]);
    } catch {
      const repaired = repairJson(jsonMatch[0]);
      data = JSON.parse(repaired);
    }
    let totalScore = data.totalScore || 0;

    // Apply source count multiplier boost
    const sourceCount = sources.length;
    let sourceMultiplier = 1.0;
    if (sourceCount >= 30) {
      sourceMultiplier = 1.25;
    } else if (sourceCount >= 20) {
      sourceMultiplier = 1.15;
    } else if (sourceCount >= 10) {
      sourceMultiplier = 1.08;
    }
    totalScore = Math.min(100, Math.round(totalScore * sourceMultiplier));

    // Determine confidence level
    const level = Object.entries(CONFIDENCE_LEVELS).find(
      ([_, range]) => totalScore >= range.min && totalScore <= range.max
    )?.[1].label || 'Unknown';

    return {
      confidence: Math.min(100, Math.max(0, totalScore)),
      breakdown: data.breakdown || [],
      sources,
      level,
    };
  }

  /**
   * Validate hypothesis using WTP/ATP scoring system
   */
  async validateHypothesis(hypothesis: string, niche: string): Promise<HypothesisCheck> {
    const provider = getProvider('openrouter', this.apiKey);

    // Get web search context
    const searchQuery = `${hypothesis} ${niche} market research`;
    let searchContext = '\n\nNo results found from any source. Base analysis on general market knowledge.';
    
    try {
      const response = await fetch('/api/research/machine-gun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.stats?.totalResults > 0) {
          searchContext = `\n\nMULTI-SOURCE RESEARCH (${data.stats.successfulSources}/8 sources, ${data.stats.totalResults} results):\n${data.formatted}`;
        }
      }
    } catch (error) {
      console.error('[ScoringEngine] API Machine Gun failed:', error);
    }

    const systemPrompt = `You are a market research analyst evaluating business hypotheses using WTP/ATP scoring.

WTP (Willingness to Pay): How much customers want to pay for this solution (0-100)
- Evidence: pricing data, revenue numbers, funding rounds, payment behavior
- High scores need actual payment evidence or strong demand signals

ATP (Ability to Pay): How much customers can afford to pay (0-100)  
- Evidence: market size, customer segments, disposable income, budget allocation
- High scores need market size data and customer financial capacity

Be SKEPTICAL. Use web search results as primary evidence. If results are weak, score LOW.`;

    const userPrompt = `Evaluate this hypothesis in the ${niche} market:
"${hypothesis}"

Use the web search evidence to score:

WTP (Willingness to Pay) 0-100:
- Look for: pricing data, revenue numbers, customer complaints about cost, payment behavior
- High scores (80+): Strong payment evidence, proven revenue models
- Medium scores (40-79): Some pricing signals, moderate demand
- Low scores (0-39): No payment evidence, weak demand signals

ATP (Ability to Pay) 0-100:
- Look for: market size, customer budgets, industry spending, economic capacity
- High scores (80+): Large market with proven spending power
- Medium scores (40-79): Moderate market size and budgets
- Low scores (0-39): Small market or limited financial capacity

${searchContext}

Respond in JSON format:
{
  "wtp": <0-100>,
  "atp": <0-100>,
  "reasoning": "Detailed explanation of both scores with specific evidence"
}`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chatWithRetry(provider, messages);

    // Track token usage
    const tracker = getTokenTracker();
    tracker.log({
      promptTokens: response.tokens.prompt,
      completionTokens: response.tokens.completion,
      totalTokens: response.tokens.total,
      model: response.model,
      timestamp: new Date(),
      operation: 'wtp-atp-validation',
    });

    // Parse response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse WTP/ATP results: Invalid response format');
    }

    let data;
    try {
      data = JSON.parse(jsonMatch[0]);
    } catch {
      const repaired = repairJson(jsonMatch[0]);
      data = JSON.parse(repaired);
    }

    return {
      wtp: Math.min(100, Math.max(0, data.wtp || 0)),
      atp: Math.min(100, Math.max(0, data.atp || 0)),
      reasoning: data.reasoning || 'No reasoning provided'
    };
  }
}
