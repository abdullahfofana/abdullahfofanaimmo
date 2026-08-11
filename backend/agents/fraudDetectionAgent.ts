/**
 * Agent 8 — Fraud & Duplicate Detection Agent
 *
 * Silently analyzes new submissions for fraud patterns, duplicate listings,
 * and suspicious account behavior. Returns a risk assessment.
 */
import { BaseAgent } from './BaseAgent';
import { checkDuplicatesTool, getMarketStatsTool } from './tools/supabaseTools';
import { supabase } from '@/backend/supabase';
import type { AgentTool } from './BaseAgent';

// Tool: check_agent_history
const checkAgentHistoryTool: AgentTool = {
  name: 'check_agent_history',
  description: 'Check submission history for an agent/user to detect suspicious patterns.',
  parameters: {
    agentName: { type: 'string', description: 'Agent name from the listing' },
    agentPhone: { type: 'string', description: 'Agent phone number', optional: true },
  },
  execute: async (args) => {
    try {
      // Check how many listings this agent has submitted
      const { data } = await supabase
        .from('properties')
        .select('id, submissionStatus, submittedAt, price, type')
        .ilike('agent->>name', `%${args.agentName}%`) as any;

      const total = data?.length ?? 0;
      const rejected = data?.filter((p: any) => p.submissionStatus === 'rejected').length ?? 0;
      const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

      // Detect rapid submission burst (more than 5 in 24h)
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentCount = data?.filter((p: any) => p.submittedAt > last24h).length ?? 0;

      return {
        totalSubmissions: total,
        rejectedCount: rejected,
        rejectionRate: `${rejectionRate}%`,
        recentSubmissions24h: recentCount,
        suspiciousBurst: recentCount > 5,
        highRejectionRate: rejectionRate > 40,
      };
    } catch (e: any) {
      return { error: e.message, totalSubmissions: 0 };
    }
  },
};

// Tool: analyze_description_quality  
const analyzeDescriptionTool: AgentTool = {
  name: 'analyze_description_quality',
  description: 'Detect scam indicators in a property description (vague text, impossible claims, urgency pressure).',
  parameters: {
    title: { type: 'string', description: 'Property title' },
    description: { type: 'string', description: 'Property description' },
    price: { type: 'number', description: 'Listed price' },
  },
  execute: async (args) => {
    const scamKeywords = [
      'urgent', 'emergency', 'abroad', 'god bless', 'wire transfer',
      'western union', 'money order', 'no inspection', 'owner deceased',
      'divorce', 'below market', '100% safe', 'guaranteed'
    ];

    const text = `${args.title} ${args.description}`.toLowerCase();
    const foundKeywords = scamKeywords.filter(kw => text.includes(kw));

    const isVague = args.description?.length < 50;
    const hasUrgencyLanguage = foundKeywords.length > 0;

    return {
      scamKeywordsFound: foundKeywords,
      isVague,
      hasUrgencyLanguage,
      riskScore: foundKeywords.length * 20 + (isVague ? 30 : 0),
      flags: [
        ...(isVague ? ['Description too vague'] : []),
        ...(hasUrgencyLanguage ? [`Scam keywords detected: ${foundKeywords.join(', ')}`] : []),
      ],
    };
  },
};

// Tool: check_price_anomaly
const checkPriceAnomalyTool: AgentTool = {
  name: 'check_price_anomaly',
  description: 'Check if a listing price is anomalously low or high compared to market.',
  parameters: {
    price: { type: 'number', description: 'Listed price in XOF' },
    type: { type: 'string', description: 'Property type' },
    location: { type: 'string', description: 'District or city' },
    status: { type: 'string', description: 'sale or rent' },
  },
  execute: async (args) => {
    // Known market floor prices (approximate, XOF)
    const floorPrices: Record<string, Record<string, number>> = {
      sale: { apartment: 10_000_000, house: 20_000_000, villa: 50_000_000, land: 5_000_000, commercial: 15_000_000 },
      rent: { apartment: 50_000, house: 80_000, villa: 200_000, land: 20_000, commercial: 100_000 },
    };

    const floor = floorPrices[args.status]?.[args.type] ?? 0;
    const tooLow = floor > 0 && args.price < floor * 0.5;
    const extremelyLow = floor > 0 && args.price < floor * 0.2;

    return {
      listedPrice: args.price,
      marketFloor: floor,
      tooLow,
      extremelyLow,
      percentageOfFloor: floor > 0 ? Math.round((args.price / floor) * 100) : null,
      flag: extremelyLow
        ? 'EXTREME: Price is less than 20% of market floor — likely fraud or data error.'
        : tooLow
        ? 'WARNING: Price is unusually low — verify before approving.'
        : 'Price appears reasonable.',
    };
  },
};

export interface FraudReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0–100
  isDuplicate: boolean;
  flags: string[];
  summary: string;
  recommendation: 'approve' | 'review' | 'reject' | 'escalate';
  checkedAt: string;
}

export class FraudDetectionAgent extends BaseAgent {
  protected name = 'FraudDetectionAgent';
  protected model = 'gpt-3.5-turbo';
  protected maxSteps = 6;

  protected systemPrompt = `You are ImmoCI's Fraud & Duplicate Detection Agent.
Silently analyze property submissions for fraud, duplicates, and suspicious behavior.

TASKS (run ALL checks):
1. Call check_duplicate_listings to detect duplicates.
2. Call check_agent_history to detect suspicious agents.
3. Call analyze_description_quality to find scam language.
4. Call check_price_anomaly to detect impossible prices.
5. Call get_market_stats to validate price against real data.
6. Synthesize all findings into a fraud report.

RETURN FORMAT (valid JSON):
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskScore": number (0-100),
  "isDuplicate": boolean,
  "flags": ["specific concern 1", "specific concern 2"],
  "summary": "one sentence verdict",
  "recommendation": "approve" | "review" | "reject" | "escalate"
}

RISK SCORING:
- Duplicate found: +40
- Scam keywords: +25 each
- Price < 20% floor: +35
- Agent >40% rejection rate: +20
- Submission burst (>5/day): +15
- Vague description: +10

RECOMMENDATIONS:
- 0–20: approve
- 21–50: review (human should check)
- 51–75: reject
- 76–100: escalate (potential organized fraud)`;

  protected tools = [
    checkDuplicatesTool,
    checkAgentHistoryTool,
    analyzeDescriptionTool,
    checkPriceAnomalyTool,
    getMarketStatsTool,
  ];

  async analyze(property: {
    title: string;
    description: string;
    price: number;
    type: string;
    status: string;
    location: { address: string; city: string; district: string };
    agent: { name: string; phone?: string };
    photos: string[];
  }): Promise<FraudReport> {
    const prompt = `Perform a complete fraud analysis on this property submission:\n${JSON.stringify(property, null, 2)}`;

    try {
      const raw = await this.run(prompt, { property });
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { ...parsed, checkedAt: new Date().toISOString() };
      }
    } catch {
      // fall through
    }

    return {
      riskLevel: 'low',
      riskScore: 0,
      isDuplicate: false,
      flags: [],
      summary: 'Fraud analysis unavailable — auto-passed.',
      recommendation: 'review',
      checkedAt: new Date().toISOString(),
    };
  }

  protected fallbackResponse(): string {
    return JSON.stringify({
      riskLevel: 'low',
      riskScore: 0,
      isDuplicate: false,
      flags: [],
      summary: 'AI offline — manual review recommended.',
      recommendation: 'review',
    });
  }
}

export const fraudDetectionAgent = new FraudDetectionAgent();
