const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'we', 'our', 'your', 'their', 'this',
  'these', 'those', 'can', 'could', 'would', 'should', 'may', 'might',
  'must', 'shall', 'do', 'does', 'did', 'have', 'had', 'been', 'being',
  'am', 'or', 'but', 'not', 'no', 'yes', 'if', 'then', 'than', 'so'
]);

const INDUSTRY_KEYWORDS: Record<string, string> = {
  saas: 'software',
  fintech: 'financial technology',
  healthtech: 'healthcare technology',
  edtech: 'education technology',
  ecommerce: 'retail online shopping',
  ai: 'artificial intelligence',
  devtools: 'developer tools',
  cybersecurity: 'information security',
  blockchain: 'blockchain cryptocurrency',
  iot: 'internet of things',
  cloud: 'cloud computing',
  mobile: 'mobile applications',
  gaming: 'video games',
  social: 'social media',
  marketplace: 'online marketplace',
  analytics: 'data analytics',
  automation: 'business automation',
  crm: 'customer relationship management',
  hr: 'human resources',
  legal: 'legal technology',
  real: 'real estate',
  logistics: 'supply chain logistics',
  travel: 'travel hospitality',
  food: 'food delivery',
  fitness: 'health fitness'
};

export interface ExtractedKeywords {
  keyword: string;
  industry: string;
  terms: string[];
}

export function extractKeywords(businessDescription: string): ExtractedKeywords {
  const text = businessDescription.toLowerCase();
  
  // Extract industry
  let industry = 'technology';
  for (const [key, value] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (text.includes(key)) {
      industry = value;
      break;
    }
  }
  
  // Tokenize and filter
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Get top terms by frequency, prioritize early position
  const terms = Object.entries(frequency)
    .sort((a, b) => {
      const freqDiff = b[1] - a[1];
      if (freqDiff !== 0) return freqDiff;
      return words.indexOf(a[0]) - words.indexOf(b[0]);
    })
    .slice(0, 5)
    .map(([word]) => word);
  
  // Build keyword from top 3 terms
  const keyword = terms.slice(0, 3).join(' ');
  
  return {
    keyword: keyword || businessDescription.slice(0, 50),
    industry,
    terms
  };
}
