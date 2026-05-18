import { searchWikipedia } from './wikipedia';
import { searchWikidata } from './wikidata';
import { searchHackerNews } from './hackernews';
import { searchOpenAlex } from './openAlex';
import { searchRemoteOK } from './remoteok';
import { searchPullPush } from './pullpush';
import { searchFRED } from './fred';
import { searchSerper } from './serper';

const QUERY = 'fintech payments';

async function testAllAPIs() {
  console.log(`\n-- API MACHINE GUN TEST - Query: "${QUERY}"\n${'='.repeat(50)}\n`);

  const apis = [
    { name: 'Wikipedia', fn: searchWikipedia },
    { name: 'Wikidata', fn: searchWikidata },
    { name: 'HackerNews', fn: searchHackerNews },
    { name: 'OpenAlex', fn: searchOpenAlex },
    { name: 'RemoteOK', fn: searchRemoteOK },
    { name: 'PullPush', fn: searchPullPush },
    { name: 'FRED', fn: searchFRED },
    { name: 'Serper', fn: searchSerper },
  ];

  const results = await Promise.all(apis.map(api => api.fn(QUERY)));

  console.log(`\n${'='.repeat(50)}\n SUMMARY\n`);
  
  let passed = 0, failed = 0;
  results.forEach(r => {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    const detail = r.success ? `${r.data.length} results` : r.error;
    console.log(`${status} | ${r.source.padEnd(12)} | ${r.queryTime}ms | ${detail}`);
    r.success ? passed++ : failed++;
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Passed: ${passed}/8 | ❌ Failed: ${failed}/8`);
  console.log(`${'='.repeat(50)}\n`);
}

testAllAPIs();
