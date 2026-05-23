import { callWithFallback } from './model-client';

interface QuerySet {
  [sourceKey: string]: string;
}

// Cache: avoids regenerating queries for the same idea
let cachedQueries: { idea: string; queries: Record<string, Record<string, QuerySet>> } | null = null;

function buildFallbackQueries(
  idea: string,
  pillars: { key: string; name: string; subcategories: { key: string; name: string }[] }[]
): Record<string, Record<string, QuerySet>> {
  const queries: Record<string, Record<string, QuerySet>> = {};
  const baseQuery = idea.substring(0, 60);

  for (const p of pillars) {
    queries[p.key] = {};
    for (const s of p.subcategories) {
      queries[p.key][s.key] = {
        google: baseQuery + ' ' + s.name,
        reddit: baseQuery + ' ' + s.name,
        hackernews: baseQuery + ' ' + s.name,
        wikipedia: s.name,
        academic: baseQuery + ' research',
      };
    }
  }

  return queries;
}

export async function buildSmartQueries(
  idea: string,
  geography: string,
  pillars: { key: string; name: string; subcategories: { key: string; name: string }[] }[]
): Promise<Record<string, Record<string, QuerySet>>> {
  if (cachedQueries && cachedQueries.idea === idea) return cachedQueries.queries;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const fallback = buildFallbackQueries(idea, pillars);
    cachedQueries = { idea, queries: fallback };
    return fallback;
  }

  const pillarList = pillars.map(p =>
    p.key + ': ' + p.subcategories.map(s => s.key).join(', ')
  ).join('\n');

  const prompt = 'You generate search engine queries for business idea validation research.\n\n' +
    'BUSINESS IDEA: ' + idea + '\n' +
    'GEOGRAPHY: ' + geography + '\n\n' +
    'For each pillar and subcategory below, generate ONE short, specific search query (3-8 words) that a researcher would type into Google, Reddit, or Hacker News to find REAL data about this specific business idea. The queries must be directly related to the actual business concept — never generic.\n\n' +
    'PILLARS:\n' + pillarList + '\n\n' +
    'Return JSON: { "[pillarKey]": { "[subcategoryKey]": { "google": "query", "reddit": "query", "hackernews": "query", "wikipedia": "query", "academic": "query" } } }\n' +
    'Return ONLY the JSON object.';

  try {
    const response = await callWithFallback(
      apiKey,
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 2000, jsonMode: true, taskType: 'search' }
    );
    const parsed = JSON.parse(response);
    cachedQueries = { idea, queries: parsed };
    return parsed;
  } catch {
    const fallback = buildFallbackQueries(idea, pillars);
    cachedQueries = { idea, queries: fallback };
    return fallback;
  }
}

export async function buildQuery(
  pillarKey: string,
  apiId: string,
  keywords: { keyword: string; industry: string },
  businessDescription?: string,
  subcategoryName?: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey && businessDescription && subcategoryName) {
    try {
      const prompt = `Generate a precise ${apiId} search query (5-10 words max) to find evidence about ${subcategoryName} for ${pillarKey}. The business idea is: ${businessDescription}. Return ONLY the search query text, nothing else. No quotes, no explanation.`;

      const response = await callWithFallback(
        apiKey,
        [{ role: 'user', content: prompt }],
        { temperature: 0.3, maxTokens: 50, taskType: 'search' }
      );

      return response.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      console.log('[QueryBuilder] LLM query generation failed, using fallback');
    }
  }

  return keywords.keyword + ' ' + pillarKey;
}
