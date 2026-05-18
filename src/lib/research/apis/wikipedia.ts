import { APIResult } from './types';

export async function searchWikipedia(query: string): Promise<APIResult> {
  const start = Date.now();
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=8`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const results = (json.query?.search || []).map((item: any) => ({
      title: item.title,
      snippet: item.snippet.replace(/<[^>]+>/g, ''),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
    }));
    console.log(`[Wikipedia] [OK] ${results.length} results in ${Date.now() - start}ms`);
    return { source: 'Wikipedia', success: true, data: results, queryTime: Date.now() - start };
  } catch (e: any) {
    console.error(`[Wikipedia] [FAIL] ${e.message}`);
    return { source: 'Wikipedia', success: false, data: [], error: e.message, queryTime: Date.now() - start };
  }
}
