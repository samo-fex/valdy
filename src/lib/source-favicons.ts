/**
 * Source Favicon Mapping
 * Maps API/source names to their domains for Google's favicon service
 */

const SOURCE_DOMAINS: Record<string, string> = {
  'serper': 'google.com',
  'google': 'google.com',
  'reddit': 'reddit.com',
  'hackernews': 'news.ycombinator.com',
  'ycombinator': 'news.ycombinator.com',
  'hacker_news': 'news.ycombinator.com',
  'fred': 'fred.stlouisfed.org',
  'openalex': 'openalex.org',
  'wikipedia': 'en.wikipedia.org',
  'wikidata': 'wikidata.org',
  'remoteok': 'remoteok.com',
  'pullpush': 'reddit.com',
};

const SOURCE_LABELS: Record<string, string> = {
  'serper': 'Google Search',
  'google': 'Google',
  'reddit': 'Reddit',
  'hackernews': 'Hacker News',
  'ycombinator': 'Hacker News',
  'hacker_news': 'Hacker News',
  'fred': 'FRED Economic Data',
  'openalex': 'OpenAlex',
  'wikipedia': 'Wikipedia',
  'wikidata': 'Wikidata',
  'remoteok': 'RemoteOK',
  'pullpush': 'Reddit',
};

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Get favicon URL using Google's favicon service
 */
function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/**
 * Get favicon URL for a source
 * @param sourceName - API or source name (case-insensitive)
 * @param sourceUrl - Optional URL to extract domain from (for search results)
 * @returns Favicon URL
 */
export function getSourceFavicon(sourceName: string, sourceUrl?: string): string {
  const normalized = sourceName.toLowerCase().trim();
  
  // For Serper/Google search results, use the actual website's favicon
  if ((normalized === 'serper' || normalized === 'google') && sourceUrl) {
    const domain = extractDomain(sourceUrl);
    if (domain) {
      return getFaviconUrl(domain);
    }
  }
  
  // Use Google's favicon service for all sources (more reliable)
  const domain = SOURCE_DOMAINS[normalized] || 'google.com';
  return getFaviconUrl(domain);
}

/**
 * Get human-readable label for a source
 * @param sourceName - API or source name (case-insensitive)
 * @returns Human-readable label
 */
export function getSourceLabel(sourceName: string): string {
  if (!sourceName) return 'Unknown Source';
  
  const normalized = sourceName.toLowerCase().trim();
  return SOURCE_LABELS[normalized] || sourceName;
}
