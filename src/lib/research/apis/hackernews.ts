import { APIResult } from './types';

export async function searchHackerNews(query: string): Promise<APIResult> {
  const start = Date.now();
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=8`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const results = (json.hits || []).map((item: any) => ({
      title: item.title || item.story_title || 'HN Discussion',
      snippet: item.comment_text?.slice(0, 200) || item.story_text?.slice(0, 200) || `${item.points || 0} points, ${item.num_comments || 0} comments`,
      url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`
    }));
    console.log(`[HackerNews] [OK] ${results.length} results in ${Date.now() - start}ms`);
    return { source: 'HackerNews', success: true, data: results, queryTime: Date.now() - start };
  } catch (e: any) {
    console.error(`[HackerNews] [FAIL] ${e.message}`);
    return { source: 'HackerNews', success: false, data: [], error: e.message, queryTime: Date.now() - start };
  }
}
