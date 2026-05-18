/**
 * Static API client for GitHub Pages deployment
 * Calls Pollinations.ai BYOP directly from the browser
 */

const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai/v1';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  content: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number };
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

interface HealthStatus {
  connected: boolean;
  lastSuccessfulRequest: Date | null;
  rateLimitInfo: RateLimitInfo | null;
}

export class PollinationsStaticClient {
  name = 'Pollinations';
  private apiKey: string;
  private baseUrl = POLLINATIONS_BASE_URL;
  private rateLimitInfo: RateLimitInfo | null = null;
  private lastSuccessfulRequest: Date | null = null;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');

    if (!limit || !remaining || !reset) return null;

    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: new Date(parseInt(reset, 10) * 1000),
    };
  }

  async chat(messages: ChatMessage[], options: {
    model?: string;
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
  } = {}): Promise<ChatResponse> {
    const { model = 'openai', temperature = 0.7, jsonMode = false, maxTokens = 4000 } = options;

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      this.rateLimitInfo = this.parseRateLimitHeaders(response.headers);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pollinations API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      this.lastSuccessfulRequest = new Date();

      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model || model,
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout after 60 seconds');
      }
      throw error;
    }
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  getHealthStatus(): HealthStatus {
    return {
      connected: this.lastSuccessfulRequest !== null,
      lastSuccessfulRequest: this.lastSuccessfulRequest,
      rateLimitInfo: this.rateLimitInfo,
    };
  }

  async validateKey(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
      });

      if (!response.ok) {
        return ['openai', 'deepseek', 'mistral', 'qwen'];
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || ['openai', 'deepseek', 'mistral', 'qwen'];
    } catch {
      return ['openai', 'deepseek', 'mistral', 'qwen'];
    }
  }
}

// Singleton instance for static deployment
let staticClient: PollinationsStaticClient | null = null;

export function getStaticClient(): PollinationsStaticClient {
  if (!staticClient) {
    // Try to get API key from localStorage or environment
    const apiKey = localStorage.getItem('pollinations_api_key') || 
                   import.meta.env.VITE_POLLINATIONS_API_KEY || '';
    staticClient = new PollinationsStaticClient(apiKey);
  }
  return staticClient;
}

export function setStaticApiKey(key: string) {
  localStorage.setItem('pollinations_api_key', key);
  if (staticClient) {
    staticClient.setApiKey(key);
  }
}
