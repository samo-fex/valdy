import { APIResult } from './types';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

if (!SERPER_API_KEY) {
  console.warn('[Serper] WARNING: SERPER_API_KEY not set in environment variables');
}

export async function searchSerper(query: string): Promise<APIResult> {
  const start = Date.now();
  try {
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY not configured');
    }
    
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 8 })
    });
    
    const json = await res.json();
    
    // Handle credit exhaustion or other API errors
    if (!res.ok || json.statusCode === 400) {
      const errorMsg = json.message || `HTTP ${res.status}`;
      console.log(`[Serper] [WARN] ${errorMsg} - trying Brave Search fallback`);
      return searchBrave(query);
    }
    
    const results = (json.organic || []).map((item: any) => ({
      title: item.title || 'Web Result',
      snippet: item.snippet || '',
      url: item.link
    }));
    console.log(`[Serper] [OK] ${results.length} results in ${Date.now() - start}ms`);
    return { source: 'Serper', success: true, data: results, queryTime: Date.now() - start };
  } catch (e: any) {
    console.error(`[Serper] [FAIL] ${e.message} - trying Brave Search fallback`);
    return searchBrave(query);
  }
}

// Brave Search API fallback (free tier: 2,000 queries/month)
// Get API key at: https://brave.com/search/api/
async function searchBrave(query: string): Promise<APIResult> {
  const start = Date.now();
  
  if (!BRAVE_API_KEY) {
    console.log(`[Brave] [WARN] No BRAVE_API_KEY set. Add to .env.local to enable web search.`);
    console.log(`[Brave] Get free API key at: https://brave.com/search/api/`);
    return { source: 'Brave', success: true, data: [], queryTime: Date.now() - start };
  }
  
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    const res = await fetch(url, {
      headers: { 
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const json = await res.json();
    const results = (json.web?.results || []).map((item: any) => ({
      title: item.title || 'Web Result',
      snippet: item.description || '',
      url: item.url
    }));
    
    console.log(`[Brave] [OK] ${results.length} results in ${Date.now() - start}ms`);
    return { source: 'Brave', success: true, data: results, queryTime: Date.now() - start };
  } catch (e: any) {
    console.error(`[Brave] [FAIL] ${e.message}`);
    return { source: 'Brave', success: false, data: [], error: e.message, queryTime: Date.now() - start };
  }
}
