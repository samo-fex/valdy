/**
 * API Registry - Central hub for all external API connections
 *
 * Features:
 * - Auto-discovery: Add new APIs here and they appear in admin panel
 * - Category tagging: Tag APIs for specific pillar use cases
 * - Test functions: Each API has a ping/test function
 * - Extensible: Easy to add new APIs
 */

// 7 Business Pillars (Categories)
export type PillarCategory =
  | 'problem'      // Problem Severity
  | 'market'       // Market Opportunity
  | 'competition'  // Competitive Landscape
  | 'solution'     // Solution Fit
  | 'monetization' // Monetization Potential
  | 'gtm'          // Go-to-Market Clarity
  | 'timing';      // Timing & Trends

export const PILLAR_LABELS: Record<PillarCategory, string> = {
  problem: 'Problem Severity',
  market: 'Market Opportunity',
  competition: 'Competitive Landscape',
  solution: 'Solution Fit',
  monetization: 'Monetization Potential',
  gtm: 'Go-to-Market Clarity',
  timing: 'Timing & Trends',
};

export const PILLAR_COLORS: Record<PillarCategory, string> = {
  problem: '#EF4444',      // Red
  market: '#10B981',       // Green
  competition: '#F59E0B',  // Amber
  solution: '#3B82F6',     // Blue
  monetization: '#8B5CF6', // Purple
  gtm: '#EC4899',          // Pink
  timing: '#06B6D4',       // Cyan
};

export interface APIConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: PillarCategory[];
  requiresKey: boolean;
  keyEnvVar?: string;
  docsUrl?: string;
  rateLimit?: string;
  testQuery: string;
}

/**
 * CENTRAL API REGISTRY
 *
 * To add a new API:
 * 1. Add entry here with all metadata
 * 2. Create the search function in /lib/research/apis/
 * 3. It will auto-appear in the admin dashboard
 */
export const API_REGISTRY: APIConfig[] = [
  {
    id: 'serper',
    name: 'Serper (Google)',
    description: 'Web search via Google. Primary source for news, articles, and general web content.',
    icon: 'search',
    categories: ['problem', 'market', 'competition', 'solution', 'monetization', 'gtm', 'timing'],
    requiresKey: true,
    keyEnvVar: 'SERPER_API_KEY',
    docsUrl: 'https://serper.dev/docs',
    rateLimit: '2,500/month (free)',
    testQuery: `SaaS market trends ${new Date().getFullYear()}`,
  },
  {
    id: 'openrouter',
    name: 'Pollinations.ai (LLM)',
    description: 'AI model gateway. Powers all LLM-based analysis and scoring.',
    icon: 'cpu',
    categories: ['problem', 'market', 'competition', 'solution', 'monetization', 'gtm', 'timing'],
    requiresKey: false,
    keyEnvVar: 'OPENROUTER_API_KEY',
    docsUrl: 'https://gen.pollinations.ai/docs',
    rateLimit: 'Free, optional BYOP token',
    testQuery: 'ping',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    description: 'Encyclopedia articles. Good for background research, definitions, and established knowledge.',
    icon: 'book-open',
    categories: ['problem', 'market', 'competition', 'solution'],
    requiresKey: false,
    docsUrl: 'https://www.mediawiki.org/wiki/API:Main_page',
    rateLimit: 'Unlimited (be respectful)',
    testQuery: 'Software as a Service',
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    description: 'Structured data from Wikipedia. Good for entity relationships and factual data.',
    icon: 'database',
    categories: ['market', 'competition'],
    requiresKey: false,
    docsUrl: 'https://www.wikidata.org/wiki/Wikidata:Data_access',
    rateLimit: 'Unlimited (be respectful)',
    testQuery: 'cloud computing',
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    description: 'Tech community discussions. Great for startup sentiment, tech trends, and founder perspectives.',
    icon: 'message-square',
    categories: ['problem', 'solution', 'timing', 'competition'],
    requiresKey: false,
    docsUrl: 'https://github.com/HackerNews/API',
    rateLimit: 'Unlimited',
    testQuery: 'startup validation',
  },
  {
    id: 'openalex',
    name: 'OpenAlex',
    description: 'Academic papers and research. For scholarly evidence, studies, and academic validation.',
    icon: 'graduation-cap',
    categories: ['problem', 'market', 'solution'],
    requiresKey: false,
    docsUrl: 'https://docs.openalex.org/',
    rateLimit: '100,000/day',
    testQuery: 'market validation methodology',
  },
  {
    id: 'remoteok',
    name: 'RemoteOK',
    description: 'Remote job postings. Useful for market demand signals and hiring trends.',
    icon: 'briefcase',
    categories: ['market', 'gtm', 'timing'],
    requiresKey: false,
    docsUrl: 'https://remoteok.com/api',
    rateLimit: 'Unlimited',
    testQuery: 'product manager',
  },
  {
    id: 'pullpush',
    name: 'PullPush (Reddit)',
    description: 'Reddit archive search. Community discussions, pain points, and user feedback.',
    icon: 'users',
    categories: ['problem', 'solution', 'competition'],
    requiresKey: false,
    docsUrl: 'https://pullpush.io/',
    rateLimit: 'Fair use',
    testQuery: 'SaaS pain points',
  },
  {
    id: 'fred',
    name: 'FRED (Federal Reserve)',
    description: 'Economic data from the Federal Reserve. Macroeconomic indicators and trends.',
    icon: 'bar-chart-2',
    categories: ['market', 'timing', 'monetization'],
    requiresKey: true,
    keyEnvVar: 'FRED_API_KEY',
    docsUrl: 'https://fred.stlouisfed.org/docs/api/fred/',
    rateLimit: '120/minute',
    testQuery: 'GDP',
  },
];

/**
 * Get all registered APIs
 */
export function getAllAPIs(): APIConfig[] {
  return API_REGISTRY;
}

/**
 * Get APIs by category/pillar
 */
export function getAPIsByCategory(category: PillarCategory): APIConfig[] {
  return API_REGISTRY.filter(api => api.categories.includes(category));
}

/**
 * Get a specific API config
 */
export function getAPIById(id: string): APIConfig | undefined {
  return API_REGISTRY.find(api => api.id === id);
}

/**
 * Check if API key is configured
 */
export function isAPIKeyConfigured(api: APIConfig): boolean {
  if (!api.requiresKey) return true;
  if (!api.keyEnvVar) return true;
  return !!process.env[api.keyEnvVar];
}

/**
 * Get API statistics
 */
export function getAPIStats() {
  const total = API_REGISTRY.length;
  const withKeys = API_REGISTRY.filter(api => !api.requiresKey || (api.keyEnvVar && process.env[api.keyEnvVar])).length;
  const byCategory: Record<PillarCategory, number> = {
    problem: 0, market: 0, competition: 0, solution: 0, monetization: 0, gtm: 0, timing: 0
  };

  API_REGISTRY.forEach(api => {
    api.categories.forEach(cat => byCategory[cat]++);
  });

  return { total, withKeys, byCategory };
}
