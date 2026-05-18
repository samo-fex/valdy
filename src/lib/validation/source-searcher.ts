import { PILLARS } from './config';
import { callWithFallback } from './model-client';
import { extractKeywords } from './keyword-extractor';
import { buildQuery } from './query-builder';
import { getApiConfig, getApisForPillar } from './registry-loader';
import { searchSerper } from '../research/apis/serper';
import { searchPullPush } from '../research/apis/pullpush';
import { searchHackerNews } from '../research/apis/hackernews';
import { searchFRED } from '../research/apis/fred';
import { searchOpenAlex } from '../research/apis/openAlex';
import { searchWikipedia } from '../research/apis/wikipedia';
import { searchWikidata } from '../research/apis/wikidata';
import { searchRemoteOK } from '../research/apis/remoteok';

const API_FUNCTIONS: Record<string, (query: string) => Promise<any>> = {
  serper: searchSerper,
  reddit: searchPullPush,
  hackernews: searchHackerNews,
  fred: searchFRED,
  openalex: searchOpenAlex,
  wikipedia: searchWikipedia,
  wikidata: searchWikidata,
  remoteok: searchRemoteOK,
};

interface AnalyzedSource {
  apiId: string;
  apiName: string;
  apiIcon: string;
  apiColor: string;
  status: 'found' | 'not_found' | 'irrelevant';
  title?: string;
  url?: string;
  snippet?: string;
  publishedDate?: string;
  relevanceScore?: number;
  supports?: string[];
  concerns?: string[];
  impactOnScore?: number;
  confidence?: number;
}

/**
 * Search and analyze a source using targeted API calls from registry
 */
export async function searchAndAnalyzeSource(
  idea: string,
  pillarKey: string,
  subcategoryKey: string,
  apiId: string,
  geography: string = 'Global',
  preGeneratedQuery?: string
): Promise<AnalyzedSource> {

  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiConfig = getApiConfig(apiId);
  
  if (!apiKey || !apiConfig) {
    return { 
      apiId, 
      apiName: apiConfig?.name || apiId,
      apiIcon: apiConfig?.icon || 'globe',
      apiColor: apiConfig?.color || '#666666',
      status: 'not_found' 
    };
  }

  const pillar = PILLARS.find(p => p.key === pillarKey);
  const subcategory = pillar?.subcategories.find(s => s.key === subcategoryKey);

  if (!pillar || !subcategory) {
    return { 
      apiId, 
      apiName: apiConfig.name,
      apiIcon: apiConfig.icon,
      apiColor: apiConfig.color,
      status: 'not_found' 
    };
  }

  try {
    // Use pre-generated query if provided, otherwise fallback to LLM-generated query
    let searchQuery: string;
    if (preGeneratedQuery) {
      searchQuery = preGeneratedQuery;
    } else {
      const keywords = extractKeywords(idea);
      searchQuery = await buildQuery(pillarKey, apiId, keywords, idea, subcategory?.name);
    }

    console.log(`[SourceSearcher] Searching ${apiConfig.name} (${apiId}): "${searchQuery}"`);

    // Call the specific API function
    const apiFunction = API_FUNCTIONS[apiId];
    if (!apiFunction) {
      console.log(`[SourceSearcher] [FAIL] No API function for ${apiId}`);
      return { 
        apiId, 
        apiName: apiConfig.name,
        apiIcon: apiConfig.icon,
        apiColor: apiConfig.color,
        status: 'not_found' 
      };
    }

    const apiResult = await apiFunction(searchQuery);

    if (!apiResult.success || !apiResult.data || apiResult.data.length === 0) {
      console.log(`[SourceSearcher] [FAIL] No results for ${apiId}`);
      return { 
        apiId, 
        apiName: apiConfig.name,
        apiIcon: apiConfig.icon,
        apiColor: apiConfig.color,
        status: 'not_found' 
      };
    }

    // Get the best result (first one)
    const bestResult = apiResult.data[0];

    if (!bestResult || !bestResult.title) {
      return { 
        apiId, 
        apiName: apiConfig.name,
        apiIcon: apiConfig.icon,
        apiColor: apiConfig.color,
        status: 'not_found' 
      };
    }

    // Format results for LLM analysis
    const formattedResults = apiResult.data
      .slice(0, 3)
      .map((r: any, i: number) => `${i + 1}. ${r.title}\n   ${r.snippet || 'No snippet'}\n   ${r.url || 'No URL'}`)
      .join('\n\n');

    // Use LLM to analyze the REAL results
    const currentYear = new Date().getFullYear();
    const analysisPrompt = `You are analyzing REAL search results for a business idea validation.

BUSINESS IDEA: "${idea}"
TARGET GEOGRAPHY: ${geography}

PILLAR: ${pillar.name}
SUBCATEGORY: ${subcategory.name}
SOURCE: ${apiConfig.name}

REAL SEARCH RESULTS FROM ${apiConfig.name.toUpperCase()}:
${formattedResults}

BEST MATCHING RESULT:
Title: ${bestResult.title}
Snippet: ${bestResult.snippet || 'N/A'}
URL: ${bestResult.url || 'N/A'}

Analyze how this REAL evidence supports or challenges the business idea for this subcategory IN THE CONTEXT OF ${geography}. Consider:
- Market size and opportunity specific to ${geography}
- Local competitors and alternatives in ${geography}
- Regulatory environment and constraints in ${geography}
- Cultural and economic factors relevant to ${geography}
- Current year is ${currentYear}

OUTPUT FORMAT (JSON):
{
  "relevanceScore": 1-100,
  "supports": ["Point 1 that supports the idea based on this source", "Point 2"],
  "concerns": ["Concern 1 raised by this source"],
  "impactOnScore": -20 to +20 (how this affects subcategory score),
  "confidence": 1-100 (your confidence in this analysis)
}`;

    const content = await callWithFallback(
      apiKey,
      [{ role: 'user', content: analysisPrompt }],
      { temperature: 0.2, maxTokens: 500 }
    );

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let analysis = { relevanceScore: 70, supports: [], concerns: [], impactOnScore: 0, confidence: 70 };

    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log('[SourceSearcher] Could not parse LLM analysis, using defaults');
      }
    }

    console.log(`[SourceSearcher] [OK] Found ${apiId}: "${bestResult.title?.slice(0, 50)}..."`);

    // Filter out low-relevance sources
    const isIrrelevant = analysis.relevanceScore < 20;

    return {
      apiId,
      apiName: apiConfig.name,
      apiIcon: apiConfig.icon,
      apiColor: apiConfig.color,
      status: isIrrelevant ? 'irrelevant' : 'found',
      title: bestResult.title,
      url: bestResult.url,
      snippet: bestResult.snippet,
      relevanceScore: analysis.relevanceScore,
      supports: analysis.supports || [],
      concerns: analysis.concerns || [],
      impactOnScore: isIrrelevant ? 0 : (analysis.impactOnScore || 0),
      confidence: analysis.confidence || 70
    };

  } catch (error: any) {
    console.error(`[SourceSearcher] [FAIL] Error for ${apiId}:`, error.message);
    return { 
      apiId, 
      apiName: apiConfig.name,
      apiIcon: apiConfig.icon,
      apiColor: apiConfig.color,
      status: 'not_found' 
    };
  }
}

export async function calculateSubcategoryScore(
  idea: string,
  pillarKey: string,
  subcategoryKey: string,
  sources: AnalyzedSource[],
  geography: string = 'Global'
): Promise<number> {

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return 50;

  const pillar = PILLARS.find(p => p.key === pillarKey);
  const subcategory = pillar?.subcategories.find(s => s.key === subcategoryKey);

  if (!subcategory) return 50;

  const foundSources = sources.filter(s => s.status === 'found');

  if (foundSources.length === 0) {
    return 50; // Neutral score when no sources found
  }

  // Calculate score based on found sources
  const avgRelevance = foundSources.reduce((sum, s) => sum + (s.relevanceScore || 50), 0) / foundSources.length;
  const avgImpact = foundSources.reduce((sum, s) => sum + (s.impactOnScore || 0), 0) / foundSources.length;

  // Base score from relevance + impact adjustment
  let score = Math.round(avgRelevance + avgImpact);

  // Bonus for multiple sources found
  if (foundSources.length >= 3) score += 5;
  if (foundSources.length >= 4) score += 5;

  // Clamp to valid range
  return Math.min(100, Math.max(1, score));
}

export type { AnalyzedSource };
