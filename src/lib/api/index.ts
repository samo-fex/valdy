import { AIProvider } from './types';
import { OpenRouterProvider } from './openrouter';

export type ProviderType = 'openrouter' | 'anthropic' | 'openai';

export function getProvider(type: ProviderType, apiKey: string): AIProvider {
  switch (type) {
    case 'openrouter':
      return new OpenRouterProvider(apiKey);
    case 'anthropic':
      throw new Error('Anthropic provider not implemented yet');
    case 'openai':
      throw new Error('OpenAI provider not implemented yet');
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('curatos_mode');
}

export function storeApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('curatos_mode', key);
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('curatos_mode');
}

export * from './types';
export * from './openrouter';
