/**
 * Agent 6 — Admin Analytics & Insights Agent
 *
 * Reads platform metrics and generates weekly reports, anomaly alerts,
 * and trend predictions for the admin dashboard.
 */
import { BaseAgent } from './BaseAgent';
import { getPlatformAnalyticsTool, getMarketStatsTool } from './tools/supabaseTools';
import { supabase } from '@/backend/supabase';
import type { AgentTool } from './BaseAgent';

// Tool: get_recent_activity_trends
const getRecentActivityTrendsTool: AgentTool = {
  name: 'get_recent_activity_trends',
  description: 'Get property submission trends for the last 30 days.',
  parameters: {
    days: { type: 'number', description: 'Number of past days to analyze', optional: true },
  },
  execute: async (args) => {
    try {
      const daysBack = args.days ?? 30;
      const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      const { data: recent } = await supabase
        .from('properties')
        .select('submissionStatus, submittedAt, type, location')
        .gte('submittedAt', since) as any;

      const total = recent?.length ?? 0;
      const approved = recent?.filter((p: any) => p.submissionStatus === 'approved').length ?? 0;
      const pending = recent?.filter((p: any) => p.submissionStatus === 'pending').length ?? 0;
      const rejected = recent?.filter((p: any) => p.submissionStatus === 'rejected').length ?? 0;

      // Count by type
      const byType: Record<string, number> = {};
      recent?.forEach((p: any) => {
        byType[p.type] = (byType[p.type] ?? 0) + 1;
      });

      return { total, approved, pending, rejected, byType, period: `${daysBack} days` };
    } catch (e: any) {
      return { total: 0, error: e.message };
    }
  },
};

// Tool: get_top_performing_zones
const getTopZonesTool: AgentTool = {
  name: 'get_top_performing_zones',
  description: 'Get the districts with the most property listings.',
  parameters: {},
  execute: async () => {
    try {
      const { data } = await supabase
        .from('properties')
        .select('location')
        .eq('submissionStatus', 'approved') as any;

      const zones: Record<string, number> = {};
      data?.forEach((p: any) => {
        const district = p.location?.district ?? 'Unknown';
        zones[district] = (zones[district] ?? 0) + 1;
      });

      const sorted = Object.entries(zones)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([district, count]) => ({ district, count }));

      return { topZones: sorted };
    } catch (e: any) {
      return { topZones: [], error: e.message };
    }
  },
};

export interface AdminInsights {
  summary: string;
  keyMetrics: Record<string, string | number>;
  anomalies: string[];
  trends: string[];
  recommendations: string[];
  generatedAt: string;
}

export class AnalyticsAgent extends BaseAgent {
  protected name = 'AnalyticsAgent';
  protected model = 'gpt-3.5-turbo';
  protected maxSteps = 5;

  protected systemPrompt = `You are ImmoCI's Admin Analytics & Insights Agent.
Your job is to analyze platform data and generate actionable insights for the admin.

TASKS:
1. Call get_platform_analytics for overall metrics.
2. Call get_recent_activity_trends to analyze submission patterns.
3. Call get_top_performing_zones to identify hot markets.
4. Generate a comprehensive insights report.

RETURN FORMAT (valid JSON):
{
  "summary": "one paragraph executive summary",
  "keyMetrics": { "metric_name": value },
  "anomalies": ["anomaly description"],
  "trends": ["trend observation"],
  "recommendations": ["actionable recommendation for the admin"]
}

Be data-driven. Highlight anything unusual (sudden drops, spikes, high pending count).
Write in English. Be concise and executive-level.`;

  protected tools = [getPlatformAnalyticsTool, getRecentActivityTrendsTool, getTopZonesTool, getMarketStatsTool];

  async generateReport(additionalContext?: Record<string, any>): Promise<AdminInsights> {
    const prompt = 'Generate a comprehensive platform analytics report with insights and recommendations.';

    try {
      const raw = await this.run(prompt, additionalContext);
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { ...parsed, generatedAt: new Date().toISOString() };
      }
    } catch {
      // fall through
    }

    return {
      summary: 'Analytics report unavailable — AI service offline.',
      keyMetrics: {},
      anomalies: [],
      trends: [],
      recommendations: ['Ensure OpenAI API key is configured for AI insights.'],
      generatedAt: new Date().toISOString(),
    };
  }

  protected fallbackResponse(): string {
    return JSON.stringify({
      summary: 'AI analytics unavailable in offline mode.',
      keyMetrics: {},
      anomalies: [],
      trends: [],
      recommendations: ['Configure OpenAI API key to enable AI insights.'],
    });
  }
}

export const analyticsAgent = new AnalyticsAgent();
