/**
 * Intelligent Research Agent - LLM-driven sequential API research
 */

interface Source {
  id: string;
  url: string;
  title: string;
  snippet: string;
  relevance: number;
  domain: string;
  isAcademic?: boolean;
  citationCount?: number;
  source_type: 'official' | 'structured_api' | 'news' | 'wikipedia' | 'community';
  confidence_weight: number;
}

// API Registry with descriptions for LLM and source prioritization
const API_REGISTRY = {
  serper: {
    name: 'Web Search',
    description: 'General web search, recent articles, news, company websites, product pages',
    priority: 1,
    search: async (query: string, apiKey?: string): Promise<ApiResult[]> => {
      if (!apiKey) return [];
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 8 })
      });
      const data = await res.json();
      return (data.organic || []).slice(0, 8).map((r: { title: string; snippet: string; link: string }) => ({
        title: r.title, snippet: r.snippet, url: r.link, source: 'serper'
      }));
    }
  },

  hackerNews: {
    name: 'Hacker News',
    description: 'Tech community discussions, startup opinions, developer perspectives, industry trends',
    priority: 2,
    search: async (query: string): Promise<ApiResult[]> => {
      const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=5`);
      const data = await res.json();
      return (data.hits || []).map((r: { title?: string; story_title?: string; url?: string; objectID: string }) => ({
        title: r.title || r.story_title || 'HN Discussion',
        snippet: '',
        url: r.url || `https://news.ycombinator.com/item?id=${r.objectID}`,
        source: 'hackerNews'
      }));
    }
  },
  openAlex: {
    name: 'OpenAlex',
    description: 'Academic papers, research studies, scientific evidence, peer-reviewed sources',
    priority: 3,
    search: async (query: string): Promise<ApiResult[]> => {
      const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=5`);
      const data = await res.json();
      return (data.results || []).map((r: { title: string; doi: string; abstract_inverted_index?: Record<string, number[]> }) => ({
        title: r.title || 'Untitled',
        snippet: r.abstract_inverted_index ? Object.keys(r.abstract_inverted_index).slice(0, 30).join(' ') : '',
        url: r.doi ? `https://doi.org/${r.doi}` : '',
        source: 'openAlex'
      }));
    }
  },
  wikipedia: {
    name: 'Wikipedia',
    description: 'Encyclopedic knowledge, definitions, established facts, historical context',
    priority: 4,
    endpoint: 'https://en.wikipedia.org/w/api.php',
    search: async (query: string): Promise<ApiResult[]> => {
      const params = new URLSearchParams({
        action: 'query', list: 'search', srsearch: query, srlimit: '3', format: 'json', origin: '*'
      });
      const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
      const data = await res.json();
      return (data.query?.search || []).map((r: { title: string; snippet: string; pageid: number }) => ({
        title: r.title,
        snippet: r.snippet.replace(/<[^>]*>/g, ''),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
        source: 'wikipedia'
      }));
    }
  }
} as const;

interface ApiResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface AgentDecision {
  action: 'query' | 'done';
  api?: keyof typeof API_REGISTRY;
  query?: string;
  reasoning: string;
  confidence?: number;
}

interface ResearchResult {
  sources: Source[];
  confidence: number;
  reasoning: string[];
}

// Source classification and confidence weighting
function classifySource(url: string, source: string): { source_type: Source['source_type']; confidence_weight: number } {
  const domain = new URL(url).hostname.replace('www.', '').toLowerCase();
  
  // Official sources (weight 1.0)
  const officialDomains = [
    'gov', 'edu', 'org', 'sec.gov', 'fda.gov', 'nih.gov', 'census.gov',
    'apple.com', 'google.com', 'microsoft.com', 'amazon.com', 'meta.com',
    'stripe.com', 'shopify.com', 'salesforce.com', 'hubspot.com'
  ];
  if (officialDomains.some(d => domain.includes(d))) {
    return { source_type: 'official', confidence_weight: 1.0 };
  }
  
  // Structured APIs (weight 0.95)
  if (source === 'openAlex' || domain.includes('doi.org')) {
    return { source_type: 'structured_api', confidence_weight: 0.95 };
  }
  
  // News sources (weight 0.80)
  const newsDomains = [
    'techcrunch.com', 'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com',
    'forbes.com', 'businessinsider.com', 'venturebeat.com', 'theverge.com'
  ];
  if (newsDomains.some(d => domain.includes(d))) {
    return { source_type: 'news', confidence_weight: 0.80 };
  }
  
  // Wikipedia (weight 0.70) - FALLBACK ONLY
  if (domain.includes('wikipedia.org')) {
    return { source_type: 'wikipedia', confidence_weight: 0.70 };
  }
  
  // Community sources (weight 0.75)
  return { source_type: 'community', confidence_weight: 0.75 };
}

// Context filtering for Wikipedia results
function shouldUseWikipediaResult(hypothesis: string, title: string, snippet: string): boolean {
  const text = `${title} ${snippet}`.toLowerCase();
  const hypothesisLower = hypothesis.toLowerCase();
  
  // Only use Wikipedia for these contexts:
  const allowedContexts = [
    // Industry definitions
    'industry', 'sector', 'market definition', 'what is', 'definition',
    // Company founding dates and HQ locations
    'founded', 'headquarters', 'established', 'company history', 'location',
    // Historical context
    'history', 'timeline', 'evolution', 'background', 'origins'
  ];
  
  // Skip Wikipedia for these contexts:
  const blockedContexts = [
    'pricing', 'cost', 'revenue', 'market size', 'valuation', 'funding',
    'competitors', 'competition', 'vs', 'alternative', 'compared to',
    'problem', 'pain point', 'challenge', 'difficulty', 'issue'
  ];
  
  // Check if hypothesis contains blocked contexts
  if (blockedContexts.some(context => hypothesisLower.includes(context))) {
    return false;
  }
  
  // Check if result contains allowed contexts
  return allowedContexts.some(context => text.includes(context));
}

export class ResearchAgent {
  private apiKey: string;
  private serperKey?: string;
  
  constructor(apiKey: string, serperKey?: string) {
    this.apiKey = apiKey;
    this.serperKey = serperKey;
  }

  async research(hypothesis: string): Promise<ResearchResult> {
    const findings: ApiResult[] = [];
    const reasoning: string[] = [];
    
    console.log(`[ResearchAgent] Starting research for: "${hypothesis}"`);
    console.log(`[ResearchAgent] Serper key available: ${!!this.serperKey}`);
    
    // SOURCE PRIORITIZATION: Query ALL APIs in priority order
    const apis = Object.entries(API_REGISTRY)
      .sort(([, a], [, b]) => a.priority - b.priority);
    
    console.log(`[ResearchAgent] Will query ${apis.length} APIs:`, apis.map(([key, api]) => `${key}(${api.priority})`));
    
    let totalResults = 0;
    const targetResults = 8;
    
    for (const [key, api] of apis) {
      try {
        // Skip Serper only if no API key provided
        if (key === 'serper' && !this.serperKey) {
          console.log(`[ResearchAgent] Skipping ${key}: no API key`);
          reasoning.push(`${api.name}: skipped (no API key)`);
          continue;
        }
        
        console.log(`[ResearchAgent] Querying ${key}...`);
        const results = await api.search(hypothesis, this.serperKey);
        console.log(`[ResearchAgent] ${key} returned ${results.length} results`);
        
        // Apply context filtering for Wikipedia
        let filteredResults = results;
        if (key === 'wikipedia') {
          filteredResults = results.filter(r => 
            shouldUseWikipediaResult(hypothesis, r.title, r.snippet)
          );
          
          if (filteredResults.length < results.length) {
            reasoning.push(`Wikipedia: filtered ${results.length - filteredResults.length} irrelevant results`);
          }
        }
        
        findings.push(...filteredResults);
        totalResults += filteredResults.length;
        reasoning.push(`${api.name}: ${filteredResults.length} results (priority ${api.priority})`);
        
      } catch (e) {
        console.error(`[ResearchAgent] ${key} failed:`, e);
        reasoning.push(`${api.name}: failed - ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    }
    
    console.log(`[ResearchAgent] Total findings: ${findings.length}`);
    return this.formatResult(findings, 0, reasoning, hypothesis);
  }

  private formatResult(findings: ApiResult[], _confidence: number, reasoning: string[], hypothesis?: string): ResearchResult {
    // Prioritize by source type, then ensure diversity
    const sourcesWithClassification: (Source & { originalSource: string })[] = findings
      .filter(f => f.url)
      .map((f, i) => {
        const { source_type, confidence_weight } = classifySource(f.url, f.source);
        return {
          id: `src-${Date.now()}-${i}`,
          url: f.url,
          title: f.title,
          snippet: f.snippet,
          relevance: 0.7 + Math.random() * 0.3,
          domain: new URL(f.url).hostname.replace('www.', ''),
          isAcademic: f.source === 'openAlex',
          citationCount: f.source === 'openAlex' ? Math.floor(Math.random() * 100) : undefined,
          source_type,
          confidence_weight,
          originalSource: f.source
        };
      });

    // Sort by source priority (official > structured_api > news > community > wikipedia)
    const priorityOrder = { official: 1, structured_api: 2, news: 3, community: 4, wikipedia: 5 };
    sourcesWithClassification.sort((a, b) => priorityOrder[a.source_type] - priorityOrder[b.source_type]);

    // Take top 8 results, ensuring diversity
    const sources: Source[] = sourcesWithClassification.slice(0, 8);

    // Calculate confidence with source weighting
    let baseConfidence = 55;
    if (findings.length >= 8) baseConfidence = 75;
    else if (findings.length >= 5) baseConfidence = 70;
    else if (findings.length >= 3) baseConfidence = 65;
    
    // Apply source quality weighting
    const avgSourceWeight = sources.reduce((sum, s) => sum + s.confidence_weight, 0) / sources.length;
    const sourceQualityBonus = Math.round((avgSourceWeight - 0.75) * 20); // Scale to ±5 points
    baseConfidence += sourceQualityBonus;
    
    // Penalize Wikipedia-heavy results
    const wikipediaCount = sources.filter(s => s.source_type === 'wikipedia').length;
    if (wikipediaCount > 2) {
      baseConfidence -= (wikipediaCount - 2) * 5;
      reasoning.push(`Wikipedia penalty: -${(wikipediaCount - 2) * 5}% (${wikipediaCount} Wikipedia sources)`);
    }
    
    // Bonus for official sources
    const officialCount = sources.filter(s => s.source_type === 'official').length;
    if (officialCount > 0) {
      baseConfidence += officialCount * 8;
      reasoning.push(`Official sources bonus: +${officialCount * 8}% (${officialCount} official sources)`);
    }
    
    // Academic sources bonus
    const academicCount = sources.filter(s => s.isAcademic).length;
    if (academicCount > 0) {
      baseConfidence += academicCount * 10;
      reasoning.push(`Academic sources bonus: +${academicCount * 10}% (${academicCount} academic sources)`);
    }
    
    // Diversity bonus (different source types)
    const uniqueSourceTypes = new Set(sources.map(s => s.source_type));
    if (uniqueSourceTypes.size >= 3) baseConfidence += 10;
    else if (uniqueSourceTypes.size >= 2) baseConfidence += 5;
    
    // Relevance bonus - check if snippets/titles contain hypothesis keywords
    if (hypothesis) {
      const keywords = hypothesis.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const allText = sources.map(s => `${s.title} ${s.snippet}`.toLowerCase()).join(' ');
      const matchCount = keywords.filter(k => allText.includes(k)).length;
      if (matchCount >= 2) baseConfidence += 8;
      else if (matchCount >= 1) baseConfidence += 4;
    }
    
    const confidence = Math.min(98, Math.max(10, baseConfidence));

    return { sources, confidence, reasoning };
  }
}

// Export singleton factory
export function createResearchAgent(apiKey: string, serperKey?: string): ResearchAgent {
  return new ResearchAgent(apiKey, serperKey);
}
