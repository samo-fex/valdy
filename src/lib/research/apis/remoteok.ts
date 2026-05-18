import { APIResult } from './types';

export async function searchRemoteOK(query: string): Promise<APIResult> {
  const start = Date.now();
  try {
    const res = await fetch('https://remoteok.com/api');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const q = query.toLowerCase();
    const filtered = json.filter((job: any) => 
      job.position?.toLowerCase().includes(q) || 
      job.company?.toLowerCase().includes(q) ||
      job.tags?.some((t: string) => t.toLowerCase().includes(q))
    ).slice(0, 8);
    const results = filtered.map((job: any) => ({
      title: `${job.position} at ${job.company}`,
      snippet: job.tags?.join(', ') || 'Remote job',
      url: job.url || 'https://remoteok.com'
    }));
    console.log(`[RemoteOK] [OK] ${results.length} results in ${Date.now() - start}ms`);
    return { source: 'RemoteOK', success: true, data: results, queryTime: Date.now() - start };
  } catch (e: any) {
    console.error(`[RemoteOK] [FAIL] ${e.message}`);
    return { source: 'RemoteOK', success: false, data: [], error: e.message, queryTime: Date.now() - start };
  }
}
