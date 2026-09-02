export interface AiUsageMetrics {
  date: string;
  dailyLimit: number; // 1,500
  requestsUsed: number;
  balanceRequests: number;
  usedPercentage: number;
  rpmLimit: number; // 15
  tpmLimit: number; // 1,000,000
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  lastUsedAt: string | null;
  resetsIn: string;
  history: Array<{
    id: string;
    timestamp: string;
    task: string;
    promptPreview: string;
    tokens: number;
    model: string;
  }>;
  hasApiKey: boolean;
}

export interface AiAssistResponse {
  success: boolean;
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
  quota: {
    requestsUsedToday: number;
    dailyLimit: number;
    balanceRequests: number;
    usedPercentage: number;
    totalTokensToday: number;
  };
}

class AiService {
  private cachedMetrics: AiUsageMetrics | null = null;
  private listeners: Array<(metrics: AiUsageMetrics) => void> = [];

  public async getUsage(): Promise<AiUsageMetrics> {
    try {
      const res = await fetch('/api/ai/usage');
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data: AiUsageMetrics = await res.json();
      this.cachedMetrics = data;
      this.notify(data);
      return data;
    } catch (err) {
      console.warn('[AiService] Failed to load usage metrics:', err);
      const fallback: AiUsageMetrics = this.cachedMetrics || {
        date: new Date().toISOString().slice(0, 10),
        dailyLimit: 1500,
        requestsUsed: 0,
        balanceRequests: 1500,
        usedPercentage: 0,
        rpmLimit: 15,
        tpmLimit: 1000000,
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        lastUsedAt: null,
        resetsIn: '24h',
        history: [],
        hasApiKey: true
      };
      return fallback;
    }
  }

  public async runAssist(prompt: string, task: string = 'general', systemInstruction?: string): Promise<AiAssistResponse> {
    const res = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, task, systemInstruction })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
      throw new Error(errJson.error || 'Failed to generate AI response');
    }

    const data: AiAssistResponse = await res.json();
    // Refresh usage metrics after successful call
    this.getUsage().catch(() => {});
    return data;
  }

  public async resetMetrics(): Promise<void> {
    await fetch('/api/ai/reset-metrics', { method: 'POST' });
    await this.getUsage();
  }

  public subscribe(fn: (metrics: AiUsageMetrics) => void) {
    this.listeners.push(fn);
    if (this.cachedMetrics) {
      fn(this.cachedMetrics);
    } else {
      this.getUsage().then(fn).catch(() => {});
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify(metrics: AiUsageMetrics) {
    this.listeners.forEach(fn => fn(metrics));
  }
}

export const aiService = new AiService();
