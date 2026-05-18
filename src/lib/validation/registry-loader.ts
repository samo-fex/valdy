import registryData from './api-pillar-registry.json';

export interface ApiConfig {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  endpoint: string;
  requiresKey: boolean;
  envVar: string | null;
}

export interface PillarConfig {
  id: string;
  name: string;
  apis: string[];
  prompts: Record<string, string>;
}

export interface Registry {
  version: string;
  apis: Record<string, ApiConfig>;
  pillars: Record<string, PillarConfig>;
}

export function getRegistry(): Registry {
  return registryData as Registry;
}

export function getPillarConfig(pillarKey: string): PillarConfig | undefined {
  const registry = getRegistry();
  return registry.pillars[pillarKey];
}

export function getApiConfig(apiId: string): ApiConfig | undefined {
  const registry = getRegistry();
  return registry.apis[apiId];
}

export function getApisForPillar(pillarKey: string): ApiConfig[] {
  const pillar = getPillarConfig(pillarKey);
  if (!pillar) return [];
  
  const registry = getRegistry();
  return pillar.apis
    .map(apiId => registry.apis[apiId])
    .filter((api): api is ApiConfig => api !== undefined);
}

export function getPromptForApi(pillarKey: string, apiId: string): string | undefined {
  const pillar = getPillarConfig(pillarKey);
  if (!pillar) return undefined;
  return pillar.prompts[apiId];
}
