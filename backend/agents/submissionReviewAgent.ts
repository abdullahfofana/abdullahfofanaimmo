/**
 * Agent 2 — Property Submission Review Agent
 *
 * Automatically reviews new property submissions for quality, completeness,
 * policy violations, and fraud indicators. Returns a structured review report
 * with a score (1–10) and actionable suggestions.
 */
import { BaseAgent } from './BaseAgent';
import { getMarketStatsTool, checkDuplicatesTool } from './tools/supabaseTools';
import type { AgentTool } from './BaseAgent';

// Tool: validate_photos
const validatePhotosTool: AgentTool = {
  name: 'validate_photos',
  description: 'Check if the property submission has an adequate number of photos.',
  parameters: {
    photos: { type: 'array', description: 'Array of photo URLs', items: { type: 'string' } },
  },
  execute: async (args) => {
    const count = Array.isArray(args.photos) ? args.photos.length : 0;
    return {
      photoCount: count,
      adequate: count >= 2,
      recommendation: count === 0
        ? 'No photos provided — listing will not attract buyers.'
        : count === 1
        ? 'Only 1 photo — recommend at least 3 photos for better visibility.'
        : 'Photo count is adequate.',
    };
  },
};

export interface ReviewResult {
  approved: boolean;
  score: number; // 1–10
  summary: string;
  issues: string[];
  suggestions: string[];
  fraudRisk: 'low' | 'medium' | 'high';
  reviewedAt: string;
}

export class SubmissionReviewAgent extends BaseAgent {
  protected name = 'SubmissionReviewAgent';
  protected model = 'gpt-3.5-turbo';
  protected maxSteps = 5;

  protected systemPrompt = `You are ImmoCI's Property Submission Review Agent.
Review new property listings submitted to the platform for quality and policy compliance.

YOUR TASKS (always do ALL of these using tools):
1. Call check_duplicate_listings to detect duplicates.
2. Call get_market_stats to verify the price is reasonable.
3. Call validate_photos to check photo count.
4. Based on all tool results, produce a structured JSON review.

RETURN FORMAT (always valid JSON):
{
  "approved": boolean,
  "score": number (1-10),
  "summary": "one-sentence verdict",
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "fraudRisk": "low" | "medium" | "high"
}

SCORING GUIDE:
- 8–10: Approve (complete, fair price, no duplicates, good photos)
- 5–7: Conditional (minor issues, approve with suggestions)
- 1–4: Reject (severe issues, duplicates, fraud indicators, missing data)

Fraud signals: price below 20% of market average, no photos, duplicate address+price, vague description.`;

  protected tools = [checkDuplicatesTool, getMarketStatsTool, validatePhotosTool];

  /**
   * Run a full review and parse the JSON output.
   */
  async review(property: {
    title: string;
    description: string;
    price: number;
    type: string;
    location: { address: string; city: string; district: string };
    photos: string[];
    features?: string[];
    status: string;
    agent?: any;
  }): Promise<ReviewResult> {
    const prompt = `Review this property submission:\n${JSON.stringify(property, null, 2)}`;

    try {
      const raw = await this.run(prompt, { property });
      // Try to extract JSON from the response
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          approved: parsed.approved ?? true,
          score: parsed.score ?? 5,
          summary: parsed.summary ?? 'Review completed.',
          issues: parsed.issues ?? [],
          suggestions: parsed.suggestions ?? [],
          fraudRisk: parsed.fraudRisk ?? 'low',
          reviewedAt: new Date().toISOString(),
        };
      }
    } catch {
      // fall through
    }

    // Safe fallback
    return {
      approved: true,
      score: 5,
      summary: 'Auto-approved (AI review unavailable).',
      issues: [],
      suggestions: ['Add more photos for better visibility.'],
      fraudRisk: 'low',
      reviewedAt: new Date().toISOString(),
    };
  }

  protected fallbackResponse(): string {
    return JSON.stringify({
      approved: true,
      score: 5,
      summary: 'Auto-approved (AI offline).',
      issues: [],
      suggestions: [],
      fraudRisk: 'low',
    });
  }
}

export const submissionReviewAgent = new SubmissionReviewAgent();
