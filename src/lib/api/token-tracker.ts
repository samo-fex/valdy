export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  timestamp: Date;
  operation: string; // 'hypothesis-generation' | 'research-validation'
}

export interface TokenStats {
  totalTokens: number;
  totalRequests: number;
  avgPerRequest: number;
  byModel: Record<string, number>;
  byOperation: Record<string, number>;
}

class TokenTracker {
  private usage: TokenUsage[] = [];

  log(usage: TokenUsage): void {
    this.usage.push(usage);
    console.log(
      `[Token Usage] ${usage.operation} | ${usage.model} | ${usage.totalTokens} tokens (prompt: ${usage.promptTokens}, completion: ${usage.completionTokens})`
    );
  }

  getStats(): TokenStats {
    const totalTokens = this.usage.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalRequests = this.usage.length;

    const byModel: Record<string, number> = {};
    const byOperation: Record<string, number> = {};

    this.usage.forEach((u) => {
      byModel[u.model] = (byModel[u.model] || 0) + u.totalTokens;
      byOperation[u.operation] = (byOperation[u.operation] || 0) + u.totalTokens;
    });

    return {
      totalTokens,
      totalRequests,
      avgPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
      byModel,
      byOperation,
    };
  }

  getUsageHistory(): TokenUsage[] {
    return [...this.usage];
  }

  reset(): void {
    this.usage = [];
  }
}

// Singleton instance
let trackerInstance: TokenTracker | null = null;

export function getTokenTracker(): TokenTracker {
  if (!trackerInstance) {
    trackerInstance = new TokenTracker();
  }
  return trackerInstance;
}
