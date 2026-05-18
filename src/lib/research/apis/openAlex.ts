import { APIResult } from './types';

export async function searchOpenAlex(query: string): Promise<APIResult> {
  const start = Date.now();
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=8`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const results = (json.results || []).map((item: any) => ({
      title: item.title || 'Academic Paper',
      snippet: `Cited ${item.cited_by_count || 0} times. ${item.authorships?.[0]?.author?.display_name || 'Unknown author'}`,
      url: item.doi ? `https://doi.org/${item.doi.replace('https://doi.org/', '')}` : item.id
    }));
    console.log(`[OpenAlex] [OK] ${results.length} results in ${Date.now() - start}ms`);
    return { source: 'OpenAlex', success: true, data: results, queryTime: Date.now() - start };
  } catch (e: any) {
    console.error(`[OpenAlex] [FAIL] ${e.message}`);
    return { source: 'OpenAlex', success: false, data: [], error: e.message, queryTime: Date.now() - start };
  }
}
