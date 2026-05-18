import { AIProvider, Message, ChatResponse, ChatOptions, RateLimitInfo, HealthStatus } from './types';
import { withRetry, DEFAULT_RETRY_CONFIG } from './retry';
import { callWithFallback } from '@/src/lib/models/config';
import { PRIMARY_MODEL, FALLBACK_CHAIN } from '@/src/lib/config/models';

export class OpenRouterProvider implements AIProvider {
  name = 'Pollinations';
  private apiKey: string;
  private baseUrl = 'https://gen.pollinations.ai/v1';
  private defaultModel = PRIMARY_MODEL;
  private rateLimitInfo: RateLimitInfo | null = null;
  private lastSuccessfulRequest: Date | null = null;
  private isLiveMode: boolean;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Live mode uses server-side proxy
    this.isLiveMode = apiKey === 'live';
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

  async chat(messages: Message[], modelOrOptions?: string | ChatOptions): Promise<ChatResponse> {
    const options = typeof modelOrOptions === 'string' 
      ? { model: modelOrOptions } 
      : modelOrOptions || {};

    // In live mode, proxy through server-side API route
    if (this.isLiveMode) {
      return this.chatViaProxy(messages, options);
    }

    // Direct call (only used server-side with actual API key)
    return this.chatDirect(messages, options);
  }

  private async chatViaProxy(messages: Message[], options: ChatOptions): Promise<ChatResponse> {
    return withRetry(async () => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: options.model || this.defaultModel,
          models: options.models,
          route: options.route,
          mode: 'live',
          jsonMode: options.jsonMode,
          temperature: options.temperature
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      this.lastSuccessfulRequest = new Date();
      
      return {
        content: data.content || '',
        model: data.model || options.model || this.defaultModel,
        tokens: data.tokens || { prompt: 0, completion: 0, total: 0 },
        annotations: data.annotations,
      };
    }, DEFAULT_RETRY_CONFIG);
  }

  private async chatDirect(messages: Message[], options: ChatOptions): Promise<ChatResponse> {
    return withRetry(async () => {
      const body: Record<string, unknown> = {
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000
      };

      if (options.jsonMode) {
        body.jsonMode = true;
      }

      if (options.models && options.route === 'fallback') {
        body.models = options.models;
        body.route = 'fallback';
      } else {
        body.model = options.model || this.defaultModel;
      }

      // Add 15 second timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://curatos.app',
            'X-Title': 'valdy'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse rate limit headers
        this.rateLimitInfo = this.parseRateLimitHeaders(response.headers);

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        this.lastSuccessfulRequest = new Date();
        
        return {
          content: data.choices[0]?.message?.content || '',
          model: data.model || options.model || this.defaultModel,
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0
        },
        annotations: data.choices[0]?.message?.annotations || undefined
      };
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout after 15 seconds');
        }
        throw error;
      }
    }, DEFAULT_RETRY_CONFIG);
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

  async listModels(): Promise<string[]> {
    // In live mode, return default models (no need to fetch)
    if (this.isLiveMode) {
      return [...FALLBACK_CHAIN];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [...FALLBACK_CHAIN];
    }
  }

  async chatWithFallback(messages: Message[]): Promise<{ response: ChatResponse; modelUsed: string; apiKeyUsed: string }> {
    const apiKeys = [
      this.apiKey,
      process.env.OPENROUTER_API_KEY,
      process.env.OPENROUTER_API_KEY_BACKUP
    ].filter(Boolean) as string[];

    return callWithFallback(this, messages, apiKeys);
  }

  async validateKey(): Promise<boolean> {
    // In live mode, validation is done via /api/validate
    if (this.isLiveMode) {
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
