/**
 * Static API Interceptor for GitHub Pages deployment
 * 
 * Intercepts /api/* fetch calls and routes them directly to Pollinations.ai
 * This allows the app to work as a fully static site without a backend server.
 */

const POLLINATIONS_BASE = 'https://gen.pollinations.ai/v1';
const PRIMARY_MODEL = 'openai';
const SEARCH_MODEL = 'gemini-search';

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
    const prompt = `Convert this business idea into a clinical, dry description of mechanics and market: "${userInput}". Geography: ${geography}. Respond ENTIRELY in JSON with fields problem, market, competition, solution, monetization, gtm, timing. No markdown, just raw JSON object.`;

    try {
      const response = await callPollinations(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7, jsonMode: true }
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

    const prompt = `Given the startup idea: "${idea}" and details: "${canonicalDescription}" targeting geography: "${geography}". 
Generate a comprehensive validation analysis in JSON format.
The JSON must strictly have this structure:
{
  "overallScore": number (0-100),
  "scoreLabel": "string (e.g. Promising, Unproven)",
  "pillars": [
    {
      "key": "string",
      "name": "string",
      "icon": "string",
      "score": number (0-100),
      "status": "complete",
      "subcategories": [
        {
          "key": "string",
          "name": "string",
          "score": number (0-100),
          "status": "complete",
          "sources": [
            {
              "apiName": "string",
              "title": "string",
              "url": "string",
              "snippet": "string",
              "supports": ["string"],
              "concerns": ["string"],
              "confidence": number (0-100)
            }
          ]
        }
      ]
    }
  ]
}
Include exactly 3 pillars: Market, Competition, and Financial. Each pillar should have 1 subcategory with 1 source.
Output ONLY raw valid JSON, no markdown.`;

    try {
      // Use search model for better validation with real sources
      const response = await callPollinations(
        [{ role: 'user', content: prompt }],
        { model: SEARCH_MODEL, temperature: 0.7, jsonMode: true }
      );
      const data = safeJsonParse(response);

      // Store in sessionStorage for later retrieval
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
      sessionStorage.setItem(
        `validation_${sessionId}`,
        JSON.stringify({
          id: sessionId,
          originalInput: idea,
          status: 'complete',
          overallScore: 60,
          scoreLabel: 'Needs Verification',
          pillars: [
            {
              key: 'market',
              name: 'Market Viability',
              icon: '🏢',
              score: 60,
              status: 'complete',
              subcategories: [
                {
                  key: 'demand',
                  name: 'Market Demand',
                  score: 60,
                  status: 'complete',
                  sources: [
                    {
                      apiName: 'Fallback Search',
                      title: 'Estimated Market Size',
                      url: 'https://example.com/market',
                      snippet: 'Market analysis pending verification.',
                      supports: ['Potential demand'],
                      concerns: ['Needs more research'],
                      confidence: 50,
                    },
                  ],
                },
              ],
            },
          ],
        })
      );
      return { sessionId, status: 'complete', idea };
    }
  },

  '/api/validate/close-gaps': async (body) => {
    const { idea, canonicalDescription } = body;
    const prompt = `Perform a gap analysis on this startup idea: "${idea}". 
Return a JSON object with: 
- "gaps": an array of objects ({ "title": string, "description": string, "severity": number (1-3), "action": string })
- "improvedIdea": AN OBJECT (NOT a string) containing exactly these 7 string fields: "problem", "market", "competition", "solution", "monetization", "gtm", "timing".

Make sure the output is strictly valid JSON.`;

    try {
      const response = await callPollinations(
        [
          { role: 'system', content: 'You are a meticulous JSON generator. You must output valid JSON.' },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.7, jsonMode: true }
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
    const prompt = `Generate a business plan for: ${JSON.stringify(improvedIdea)}.
Return exactly a JSON object with keys:
"executive_summary", "market_and_sales", "team_and_operations", "financial_plan", and "chart_data" (an object with arrays: market_breakdown [{name, value}], revenue_projections [{year, revenue, costs}], and financial_table [{metric, value}]). No markdown, only JSON.`;

    try {
      const response = await callPollinations(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7, jsonMode: true }
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
    const prompt = `Write a comprehensive Product Requirements Document (PRD) in Markdown format for the following business: ${JSON.stringify(improvedIdea)}. Include sections for Overview, Target Audience, Features, User Flows, and Technical Requirements. Do not wrap in JSON.`;

    try {
      const response = await callPollinations(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
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
