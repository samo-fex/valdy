import { APIResult } from './types';

export async function searchWikidata(query: string): Promise<APIResult> {
  const start = Date.now();
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*&limit=8`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const results = (json.search || []).map((item: any) => ({
      title: item.label,
      snippet: item.description || '',
      url: item.concepturi
    }));
    console.log(`[Wikidata] [OK] ${results.length} results in ${Date.now() - start}ms`);
    return { source: 'Wikidata', success: true, data: results, queryTime: Date.now() - start };
  } catch (e: any) {
    console.error(`[Wikidata] [FAIL] ${e.message}`);
    return { source: 'Wikidata', success: false, data: [], error: e.message, queryTime: Date.now() - start };
  }
}
