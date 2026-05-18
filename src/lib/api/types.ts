export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number; };
  annotations?: Array<{
    url_citation?: {
      url: string;
      title?: string;
      content?: string;
    };
  }>;
}

export interface ChatOptions {
  model?: string;
  models?: string[];
  route?: 'fallback';
}

export interface AIProvider {
  name: string;
  chat(messages: Message[], modelOrOptions?: string | ChatOptions): Promise<ChatResponse>;
  listModels(): Promise<string[]>;
  validateKey(): Promise<boolean>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

export interface HealthStatus {
  connected: boolean;
  lastSuccessfulRequest: Date | null;
  rateLimitInfo: RateLimitInfo | null;
}
