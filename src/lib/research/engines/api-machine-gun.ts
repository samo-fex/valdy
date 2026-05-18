import { APIResult } from '../apis/types';
import { searchWikipedia } from '../apis/wikipedia';
import { searchWikidata } from '../apis/wikidata';
import { searchHackerNews } from '../apis/hackernews';
import { searchOpenAlex } from '../apis/openAlex';
import { searchRemoteOK } from '../apis/remoteok';
import { searchPullPush } from '../apis/pullpush';
import { searchFRED } from '../apis/fred';
import { searchSerper } from '../apis/serper';

export interface MachineGunResult {
  query: string;
  results: APIResult[];
  totalSources: number;
  successfulSources: number;
  totalResults: number;
  totalTime: number;
}

export async function fireAPIMachineGun(query: string): Promise<MachineGunResult> {
  const start = Date.now();
  console.log(`\n[APIMachineGun] -- Firing 8 APIs for: "${query}"`);

  const results = await Promise.all([
    searchWikipedia(query),
    searchWikidata(query),
    searchHackerNews(query),
    searchOpenAlex(query),
    searchRemoteOK(query),
    searchPullPush(query),
    searchFRED(query),
    searchSerper(query),
  ]);

  const successful = results.filter(r => r.success);
  const totalResults = results.reduce((sum, r) => sum + r.data.length, 0);
  const totalTime = Date.now() - start;

  console.log(`[APIMachineGun] [OK] ${successful.length}/8 sources, ${totalResults} results in ${totalTime}ms`);
  results.filter(r => !r.success).forEach(r => console.log(`  [FAIL] ${r.source}: ${r.error}`));

  return {
    query,
    results,
    totalSources: 8,
    successfulSources: successful.length,
    totalResults,
    totalTime,
  };
}

export function formatResultsForLLM(machineGunResult: MachineGunResult): string {
  const sections = machineGunResult.results
    .filter(r => r.success && r.data.length > 0)
    .map(r => {
      const items = r.data.map((d, i) => `  ${i + 1}. ${d.title}\n     ${d.snippet}${d.url ? `\n     URL: ${d.url}` : ''}`).join('\n');
      return `[${r.source}] (${r.queryTime}ms)\n${items}`;
    });

  if (sections.length === 0) return 'No results found from any source.';
  return sections.join('\n\n');
}

export function extractSources(machineGunResult: MachineGunResult): string[] {
  return machineGunResult.results
    .filter(r => r.success && r.data.length > 0)
    .flatMap(r => r.data.filter(d => d.url).map(d => {
      // Format: [Source] Title ||| Snippet ||| URL
      const snippet = d.snippet?.slice(0, 200) || '';
      return `[${r.source}] ${d.title} ||| ${snippet} ||| ${d.url}`;
    }));
}
