export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(query: string, maxResults: number = 3): Promise<SearchResult[]> {
  try {
    // Use DuckDuckGo Instant Answer API (free)
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) {
      console.warn('[WebSearch] DuckDuckGo API failed, returning empty results');
      return [];
    }
    
    const data = await response.json();
    
    // Extract results from RelatedTopics
    const results: SearchResult[] = [];
    
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, maxResults)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Search Result',
            url: topic.FirstURL,
            snippet: topic.Text || ''
          });
        }
      }
    }
    
    // If no RelatedTopics, try Abstract
    if (results.length === 0 && data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || 'Search Result',
        url: data.AbstractURL,
        snippet: data.Abstract
      });
    }
    
    return results;
  } catch (error) {
    console.error('[WebSearch] Error:', error);
    return [];
  }
}
