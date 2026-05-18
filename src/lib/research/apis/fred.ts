import { APIResult } from './types';

const FRED_API_KEY = process.env.FRED_API_KEY;

export async function searchFRED(query: string): Promise<APIResult> {
  const start = Date.now();

  // Check if API key is configured
  if (!FRED_API_KEY) {
    console.log(`[FRED] [FAIL] No API key configured (FRED_API_KEY)`);
    return {
      source: 'FRED',
      success: false,
      data: [],
      error: 'API key not configured. Register at https://fred.stlouisfed.org/docs/api/api_key.html',
      queryTime: Date.now() - start
    };
  }

  try {
    // Search FRED series
    const url = `https://api.stlouisfed.org/fred/series/search?search_text=${encodeURIComponent(query)}&api_key=${FRED_API_KEY}&file_type=json&limit=8`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    const results = (json.seriess || []).map((item: any) => ({
      title: item.title || 'FRED Series',
      snippet: `${item.id} • ${item.frequency} • ${item.observation_start} to ${item.observation_end}`,
      url: `https://fred.stlouisfed.org/series/${item.id}`
    }));

    console.log(`[FRED] [OK] ${results.length} results in ${Date.now() - start}ms`);
    return { source: 'FRED', success: true, data: results, queryTime: Date.now() - start };
  } catch (e: any) {
    console.error(`[FRED] [FAIL] ${e.message}`);
    return {
      source: 'FRED',
      success: false,
      data: [],
      error: e.message,
      queryTime: Date.now() - start
    };
  }
}
