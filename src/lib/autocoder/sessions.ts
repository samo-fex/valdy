import type { AutoCoderSession } from './types';

// Persist across hot reloads in dev mode
const g = globalThis as unknown as { _acSessions?: Map<string, AutoCoderSession> };
export const sessions: Map<string, AutoCoderSession> = g._acSessions ??= new Map();
