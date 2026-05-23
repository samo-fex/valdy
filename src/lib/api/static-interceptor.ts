/**
 * Static API Interceptor for GitHub Pages deployment
 * 
 * Intercepts /api/* fetch calls and routes them directly to Pollinations.ai
 * This allows the app to work as a fully static site without a backend server.
 */

const POLLINATIONS_BASE = 'https://gen.pollinations.ai/v1';
const PRIMARY_MODEL = 'openai';
const SEARCH_MODEL = 'perplexity-fast';
const REASONING_MODEL = 'deepseek';

/**
 * Check if we're running in static mode (no backend server)
 */
function isStaticMode(): boolean {
  // Detect static deployment (GitHub Pages, etc.)
  // Static mode if hostname is github.io OR if explicitly set
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.github.io') ||
         (import.meta as any).env?.VITE_STATIC_MODE === 'true' ||
         !window.location.hostname.includes('localhost');
}

/**
 * Get the stored API key from localStorage
 */
function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('curatos_mode') ||
         (import.meta as any).env?.VITE_POLLINATIONS_API_KEY || '';
}

/**
 * Call Pollinations.ai chat completions
 */
async function callPollinations(
  messages: Array<{ role: string; content: string }>,
  options: { model?: string; temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { model = PRIMARY_MODEL, temperature = 0.7, jsonMode = false } = options;
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${POLLINATIONS_BASE}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pollinations API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Helper to safely parse JSON from LLM response (strips markdown)
 */
function safeJsonParse(text: string): any {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Route handlers - mirror the server.ts logic but client-side
 */
const routes: Record<string, (body: any) => Promise<any>> = {
  '/api/chat': async (body) => {
    const { messages, model, temperature, jsonMode } = body;
    const content = await callPollinations(messages, {
      model: model || PRIMARY_MODEL,
      temperature: temperature || 0.7,
      jsonMode,
    });
    return {
      content,
      model: model || PRIMARY_MODEL,
      tokens: { prompt: 0, completion: 0, total: 0 },
    };
  },

  '/api/validate/normalize': async (body) => {
    const { userInput, geography = 'Global' } = body;
    const prompt = `You are a senior business analyst. Analyze this business idea in detail for the ${geography} market: "${userInput}".

For each of the 7 pillars below, provide a DETAILED paragraph (3-5 sentences, 60-100 words) with specific data, numbers, and actionable insights.

Return ENTIRELY in JSON with these exact fields:
{
  "problem": "Detailed paragraph: What specific pain point does this solve? Who experiences it? How severe and frequent is it? Include concrete evidence or statistics.",
  "market": "Detailed paragraph: What is the target market size (TAM/SAM/SOM)? Growth rate? Ideal customer profile? Include specific market data for ${geography}.",
  "competition": "Detailed paragraph: Who are the main competitors? What are their strengths and weaknesses? What is the competitive advantage and differentiation opportunity?",
  "solution": "Detailed paragraph: How does the product/service work? Core mechanism, technology, and approach? What makes it unique vs alternatives?",
  "monetization": "Detailed paragraph: Revenue model, pricing strategy, expected revenue per customer, unit economics. Include specific pricing benchmarks.",
  "gtm": "Detailed paragraph: Customer acquisition strategy, marketing channels, sales model, early adopter strategy. Be specific about channels and tactics.",
  "timing": "Detailed paragraph: Why now? What technology, market, regulatory, or cultural trends support this? Include specific recent developments."
}

RULES: Return ONLY valid JSON. Each field must be 3-5 sentences (60-100 words minimum). Include specific numbers. Be factual and analytical.`;

    try {
      const response = await callPollinations(
        [{ role: 'user', content: prompt }],
        { model: REASONING_MODEL, temperature: 0.5, jsonMode: true }
      );
      const analysis = safeJsonParse(response);
      return { original: userInput, analysis };
    } catch (e) {
      return {
        original: userInput,
        analysis: {
          problem: userInput || 'Needs definition',
          market: 'Global market with varying segments',
          competition: 'Existing solutions lack modern UX',
          solution: userInput,
          monetization: 'Subscription and enterprise tiers',
          gtm: 'Direct sales and inbound marketing',
          timing: 'Growing demand makes timing optimal',
        },
      };
    }
  },

  '/api/validate': async (body) => {
    const { idea, canonicalDescription, geography } = body;
    const sessionId = Date.now().toString();

    const prompt = `You are a senior startup analyst. Given this startup idea: "${idea}" and context: "${canonicalDescription}" targeting geography: "${geography}", generate a comprehensive validation analysis.

You MUST include ALL 7 pillars with 3 subcategories each. Return strictly valid JSON (no markdown):
{
  "overallScore": number (0-100),
  "scoreLabel": "string",
  "pillars": [
    { "key": "problem", "name": "Problem Severity", "icon": "🎯", "score": number, "status": "complete", "subcategories": [
      { "key": "pain_intensity", "name": "Pain Intensity", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "2-3 sentence detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "pain_frequency", "name": "Pain Frequency", "score": number, "status": "complete", "sources": [{ "apiName": "Reddit", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "current_workarounds", "name": "Current Workarounds", "score": number, "status": "complete", "sources": [{ "apiName": "HackerNews", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] }
    ]},
    { "key": "market", "name": "Market Opportunity", "icon": "📊", "score": number, "status": "complete", "subcategories": [
      { "key": "market_size", "name": "Market Size (TAM)", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "Include specific market size figures for ${geography}", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "growth_trajectory", "name": "Growth Trajectory", "score": number, "status": "complete", "sources": [{ "apiName": "FRED", "title": "string", "url": "string", "snippet": "Include growth rate data", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "adjacent_markets", "name": "Adjacent Markets", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] }
    ]},
    { "key": "competition", "name": "Competitive Landscape", "icon": "⚔️", "score": number, "status": "complete", "subcategories": [
      { "key": "direct_competitors", "name": "Direct Competitors", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "Name specific competitors", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "competitor_weaknesses", "name": "Competitor Weaknesses", "score": number, "status": "complete", "sources": [{ "apiName": "Reddit", "title": "string", "url": "string", "snippet": "Specific complaints and gaps", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "differentiation_opportunity", "name": "Differentiation Opportunity", "score": number, "status": "complete", "sources": [{ "apiName": "HackerNews", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] }
    ]},
    { "key": "solution", "name": "Solution Fit", "icon": "🔧", "score": number, "status": "complete", "subcategories": [
      { "key": "problem_solution_match", "name": "Problem-Solution Match", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "feature_completeness", "name": "Feature Completeness", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "value_clarity", "name": "Value Clarity", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] }
    ]},
    { "key": "monetization", "name": "Monetization Potential", "icon": "💰", "score": number, "status": "complete", "subcategories": [
      { "key": "pricing_benchmarks", "name": "Pricing Benchmarks", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "Include specific pricing data for ${geography}", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "willingness_to_pay", "name": "Willingness to Pay", "score": number, "status": "complete", "sources": [{ "apiName": "Reddit", "title": "string", "url": "string", "snippet": "Payment behavior evidence", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "revenue_model_fit", "name": "Revenue Model Fit", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] }
    ]},
    { "key": "gtm", "name": "Go-to-Market Clarity", "icon": "🚀", "score": number, "status": "complete", "subcategories": [
      { "key": "channel_viability", "name": "Channel Viability", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "customer_access", "name": "Customer Access", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "viral_organic_potential", "name": "Viral/Organic Potential", "score": number, "status": "complete", "sources": [{ "apiName": "HackerNews", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] }
    ]},
    { "key": "timing", "name": "Timing & Trends", "icon": "⏰", "score": number, "status": "complete", "subcategories": [
      { "key": "technology_enablers", "name": "Technology Enablers", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "Specific recent technology developments", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "market_readiness", "name": "Market Readiness", "score": number, "status": "complete", "sources": [{ "apiName": "Google", "title": "string", "url": "string", "snippet": "detailed evidence", "supports": ["point1"], "concerns": [], "confidence": number }] },
      { "key": "macro_tailwinds", "name": "Macro Tailwinds", "score": number, "status": "complete", "sources": [{ "apiName": "FRED", "title": "string", "url": "string", "snippet": "Macro trends data", "supports": ["point1"], "concerns": [], "confidence": number }] }
    ]}
  ]
}

CRITICAL: Include ALL 7 pillars. Each snippet must be 2-3 sentences with specific data. Scores should be realistic (30-90). Output ONLY raw valid JSON.`;

    try {
      const response = await callPollinations(
        [{ role: 'user', content: prompt }],
        { model: SEARCH_MODEL, temperature: 0.5, jsonMode: true }
      );
      const data = safeJsonParse(response);

      sessionStorage.setItem(
        `validation_${sessionId}`,
        JSON.stringify({
          id: sessionId,
          originalInput: idea,
          canonicalDescription,
          status: 'complete',
          overallScore: data.overallScore || 75,
          scoreLabel: data.scoreLabel || 'Promising',
          pillars: data.pillars || [],
        })
      );

      return { sessionId, status: 'complete', idea };
    } catch (e) {
      const fallbackPillars = [
        { key: 'problem', name: 'Problem Severity', icon: '🎯', score: 60, status: 'complete', subcategories: [{ key: 'pain_intensity', name: 'Pain Intensity', score: 60, status: 'complete', sources: [{ apiName: 'Google', title: 'Market Pain Analysis', url: 'https://example.com/pain', snippet: 'Moderate pain intensity with growing adoption indicators.', supports: ['Potential demand'], concerns: ['Needs research'], confidence: 50 }] }] },
        { key: 'market', name: 'Market Opportunity', icon: '📊', score: 65, status: 'complete', subcategories: [{ key: 'market_size', name: 'Market Size (TAM)', score: 65, status: 'complete', sources: [{ apiName: 'Google', title: 'Market Size Estimate', url: 'https://example.com/market-size', snippet: 'Viable pockets of opportunity with expanding addressable market.', supports: ['Growing market'], concerns: ['Size needs validation'], confidence: 55 }] }] },
        { key: 'competition', name: 'Competitive Landscape', icon: '⚔️', score: 55, status: 'complete', subcategories: [{ key: 'direct_competitors', name: 'Direct Competitors', score: 55, status: 'complete', sources: [{ apiName: 'Google', title: 'Competitor Analysis', url: 'https://example.com/competitors', snippet: 'Several incumbents with legacy technology create differentiation opportunity.', supports: ['Weak competitors'], concerns: ['Market crowded'], confidence: 50 }] }] },
        { key: 'solution', name: 'Solution Fit', icon: '🔧', score: 60, status: 'complete', subcategories: [{ key: 'problem_solution_match', name: 'Problem-Solution Match', score: 60, status: 'complete', sources: [{ apiName: 'Google', title: 'Solution Validation', url: 'https://example.com/solution', snippet: 'The proposed solution addresses core pain points with a modern approach.', supports: ['Good fit'], concerns: ['Needs validation'], confidence: 50 }] }] },
        { key: 'monetization', name: 'Monetization Potential', icon: '💰', score: 55, status: 'complete', subcategories: [{ key: 'pricing_benchmarks', name: 'Pricing Benchmarks', score: 55, status: 'complete', sources: [{ apiName: 'Google', title: 'Pricing Analysis', url: 'https://example.com/pricing', snippet: 'Industry benchmarks suggest subscription model viability.', supports: ['Recurring revenue'], concerns: ['Price sensitivity'], confidence: 50 }] }] },
        { key: 'gtm', name: 'Go-to-Market Clarity', icon: '🚀', score: 50, status: 'complete', subcategories: [{ key: 'channel_viability', name: 'Channel Viability', score: 50, status: 'complete', sources: [{ apiName: 'Google', title: 'GTM Analysis', url: 'https://example.com/gtm', snippet: 'Digital channels available but competitive. Direct sales and partnerships show promise.', supports: ['Multiple channels'], concerns: ['CAC may be high'], confidence: 45 }] }] },
        { key: 'timing', name: 'Timing & Trends', icon: '⏰', score: 65, status: 'complete', subcategories: [{ key: 'technology_enablers', name: 'Technology Enablers', score: 65, status: 'complete', sources: [{ apiName: 'Google', title: 'Tech Trends', url: 'https://example.com/tech-trends', snippet: 'Recent technology advances make this solution more feasible than ever.', supports: ['Tech ready'], concerns: ['May be early'], confidence: 55 }] }] },
      ];
      sessionStorage.setItem(
        `validation_${sessionId}`,
        JSON.stringify({
          id: sessionId,
          originalInput: idea,
          status: 'complete',
          overallScore: 60,
          scoreLabel: 'Needs Verification',
          pillars: fallbackPillars,
        })
      );
      return { sessionId, status: 'complete', idea };
    }
  },

  '/api/validate/close-gaps': async (body) => {
    const { idea, canonicalDescription } = body;
    const prompt = `You are a senior startup analyst. Perform a thorough gap analysis on this startup idea: "${idea}" with context: "${canonicalDescription}".

Return strictly valid JSON with these fields:
{
  "gaps": [
    { "title": "string", "description": "2-3 sentences explaining the gap with specific details", "severity": number (1-3), "action": "2-3 sentence concrete action plan" }
  ],
  "improvedIdea": {
    "problem": "3-5 sentences (60-100 words): What specific pain point does this solve? Who experiences it? How severe and frequent is it? Include concrete evidence.",
    "market": "3-5 sentences (60-100 words): TAM/SAM/SOM with specific figures. Growth rate. Ideal customer profile with demographics.",
    "competition": "3-5 sentences (60-100 words): Name 2-3 specific competitors. Their weaknesses. Your differentiation angle.",
    "solution": "3-5 sentences (60-100 words): Core mechanism, technology, and approach. What makes it unique vs alternatives?",
    "monetization": "3-5 sentences (60-100 words): Revenue model, pricing strategy with specific price points. Unit economics and margins.",
    "gtm": "3-5 sentences (60-100 words): Customer acquisition strategy, specific channels, sales model, early adopter tactics.",
    "timing": "3-5 sentences (60-100 words): Why now? Specific technology, market, regulatory, or cultural trends with recent examples."
  }
}

RULES: Return ONLY valid JSON. improvedIdea must be an OBJECT with 7 fields, each 3-5 sentences (60-100 words). Include specific numbers and data. Be factual and analytical.`;

    try {
      const response = await callPollinations(
        [
          { role: 'system', content: 'You are a meticulous JSON generator. You must output valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        { model: REASONING_MODEL, temperature: 0.5, jsonMode: true }
      );

      const parsed = safeJsonParse(response);
      let improved = parsed.improvedIdea || parsed.improved_idea;

      if (!improved || typeof improved === 'string') {
        improved = {
          problem: idea || 'Needs clear problem definition.',
          market: canonicalDescription || 'Market potential.',
          competition: 'Incumbents operate with legacy technology.',
          solution: idea || 'Modern approach.',
          monetization: 'Subscription pricing.',
          gtm: 'Digital marketing.',
          timing: 'Current trends favor this.',
        };
      }

      parsed.improvedIdea = {
        problem: improved.problem || 'Undefined problem.',
        market: improved.market || 'Undefined market.',
        competition: improved.competition || 'Undefined competition.',
        solution: improved.solution || 'Undefined solution.',
        monetization: improved.monetization || 'Undefined monetization.',
        gtm: improved.gtm || 'Undefined GTM.',
        timing: improved.timing || 'Undefined timing.',
      };

      return parsed;
    } catch (e) {
      return {
        gaps: [
          {
            title: 'Marketing Strategy',
            description: 'GTM approach needs clarity',
            severity: 2,
            action: 'Define channels',
          },
        ],
        improvedIdea: {
          problem: idea || 'Needs clear problem definition.',
          market: canonicalDescription || 'Market potential.',
          competition: 'Incumbents operate with legacy technology.',
          solution: idea || 'Modern approach.',
          monetization: 'Subscription pricing.',
          gtm: 'Digital marketing.',
          timing: 'Current trends favor this.',
        },
      };
    }
  },

  '/api/validate/generate-business-plan': async (body) => {
    const { improvedIdea } = body;
    const prompt = `You are a senior business strategist. Generate a detailed business plan for this startup: ${JSON.stringify(improvedIdea)}.

Return strictly valid JSON with these keys:
{
  "executive_summary": "4-6 paragraphs covering the opportunity, solution, market size, competitive advantage, and financial outlook. Include specific numbers and projections.",
  "market_and_sales": "4-6 paragraphs detailing TAM/SAM/SOM with figures, ideal customer profile, acquisition channels with CAC estimates, sales funnel, and growth milestones.",
  "team_and_operations": "3-5 paragraphs covering key hires needed, org structure, technology stack, operational workflow, and scaling plan.",
  "financial_plan": "4-6 paragraphs with revenue projections (Year 1-5), cost structure, unit economics, break-even analysis, and funding requirements.",
  "chart_data": {
    "market_breakdown": [{ "name": "string", "value": number, "color": "hex" }],
    "revenue_projections": [{ "year": "string", "revenue": number, "costs": number }],
    "financial_table": [{ "metric": "string", "value": "string" }]
  }
}

RULES: Return ONLY valid JSON. Each text field must be multiple detailed paragraphs with specific financial figures. Be thorough and data-driven.`;

    try {
      const response = await callPollinations(
        [{ role: 'user', content: prompt }],
        { model: REASONING_MODEL, temperature: 0.5, jsonMode: true }
      );
      return { businessPlan: safeJsonParse(response) };
    } catch (e) {
      return {
        businessPlan: {
          executive_summary: 'Executive Summary',
          market_and_sales: 'Market Strategy',
          team_and_operations: 'Operations',
          financial_plan: 'Finances',
          chart_data: {
            market_breakdown: [{ name: 'Target Market', value: 100, color: '#10b981' }],
            revenue_projections: [{ year: 'Year 1', revenue: 100000, costs: 50000 }],
            financial_table: [{ metric: 'Gross Margin', value: '50%' }],
          },
        },
      };
    }
  },

  '/api/validate/generate-prd': async (body) => {
    const { improvedIdea } = body;
    const prompt = `You are a senior product manager. Write a comprehensive Product Requirements Document (PRD) in Markdown format for this startup: ${JSON.stringify(improvedIdea)}.

Include these detailed sections:
1. **Overview** - Mission, vision, problem statement, and solution summary (3-4 paragraphs)
2. **Target Audience** - 3 detailed personas with demographics, pain points, goals, and technical proficiency
3. **Features** - 6-8 features with priority (P0/P1/P2), description (2-3 sentences each), and acceptance criteria
4. **User Flows** - 3-4 key user journeys with step-by-step descriptions
5. **Technical Requirements** - Architecture overview, tech stack, integrations, performance requirements, and security considerations
6. **Success Metrics** - 5-8 KPIs with targets and measurement approach

Be thorough and specific. Output in Markdown format, not JSON.`;

    try {
      const response = await callPollinations(
        [{ role: 'user', content: prompt }],
        { model: REASONING_MODEL, temperature: 0.5 }
      );
      return { prd: response };
    } catch (e) {
      return { prd: '# PRD\n\n## Overview\nPRD generation failed.' };
    }
  },

  '/api/agent/orchestrate': async () => ({
    thought: 'Working on it...',
    action: 'WAIT',
  }),

  '/api/research/cycle': async (body) => ({
    sessionId: body.sessionId || `session_${Date.now()}`,
    state: {},
    thought: 'Working on it...',
  }),

  '/api/research/agent': async () => ({ sources: [] }),
  '/api/research/machine-gun': async () => ({ sources: [] }),
  '/api/research/producthunt': async () => ({ products: [] }),
  '/api/og-image': async () => ({ image: null }),
};

/**
 * Handle dynamic GET routes like /api/validate/:id
 */
function handleDynamicGet(url: string): any | null {
  // /api/validate/:id - retrieve session
  const validateMatch = url.match(/^\/api\/validate\/([^/]+)$/);
  if (validateMatch && validateMatch[1] !== 'normalize' && validateMatch[1] !== 'close-gaps') {
    const sessionId = validateMatch[1];
    const stored = sessionStorage.getItem(`validation_${sessionId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return { error: 'Not found' };
  }
  return null;
}

/**
 * Install the fetch interceptor
 */
export function installStaticApiInterceptor() {
  if (typeof window === 'undefined') return;
  if (!isStaticMode()) {
    console.log('[StaticAPI] Not in static mode, interceptor not installed');
    return;
  }

  console.log('[StaticAPI] Installing static API interceptor for Pollinations.ai BYOP');

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);

    // Only intercept relative /api/* calls
    if (!url.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    const method = (init?.method || 'GET').toUpperCase();

    try {
      // Handle GET requests (e.g., /api/validate/:id)
      if (method === 'GET') {
        const result = handleDynamicGet(url);
        if (result) {
          return new Response(JSON.stringify(result), {
            status: result.error ? 404 : 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ error: 'Not implemented' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Handle POST requests
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const handler = routes[url];

      if (!handler) {
        console.warn(`[StaticAPI] No handler for ${url}`);
        return new Response(JSON.stringify({ error: 'Not implemented' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await handler(body);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error(`[StaticAPI] Error handling ${url}:`, error);
      return new Response(
        JSON.stringify({ error: error.message || 'Internal error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
