import { AUTOCODER_FALLBACK_CHAIN } from '@/src/lib/config/models';

const OPENROUTER_URL = 'https://gen.pollinations.ai/openai/chat/completions';
const LLM_TIMEOUT_MS = 90_000; // 90 seconds per call

export async function callLLM(
  messages: { role: string; content: string }[],
  options?: { json?: boolean; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || 'dummy';

  for (const model of AUTOCODER_FALLBACK_CHAIN) {
    try {
      console.log(`[AutoCoder] Trying model: ${model}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://curatos.com',
        },
        body: JSON.stringify({
          model,
          messages,
          ...(options?.json ? { jsonMode: true } : {}),
          temperature: 0.7,
          max_tokens: options?.maxTokens ?? 16384,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`[AutoCoder] ${model} returned ${res.status}`);
        continue;
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log(`[AutoCoder] ✓ ${model} returned ${content.length} chars`);
        return content;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log(`[AutoCoder] ${model} timed out after ${LLM_TIMEOUT_MS / 1000}s`);
      } else {
        console.log(`[AutoCoder] ${model} error: ${e}`);
      }
      continue;
    }
  }
  throw new Error('All models failed');
}
