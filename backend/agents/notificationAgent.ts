/**
 * Agent 4 — Smart Notification & Alert Agent
 *
 * Matches newly listed properties against user preferences and decides
 * who to notify, scoring relevance to avoid spam.
 */
import { BaseAgent } from './BaseAgent';
import { getUserSavedSearchesTool } from './tools/supabaseTools';
import type { AgentTool } from './BaseAgent';

// Tool: score_relevance
const scoreRelevanceTool: AgentTool = {
  name: 'score_relevance',
  description: 'Score how relevant a new property is for a set of user preferences (0–100).',
  parameters: {
    property: { type: 'object', description: 'The new property listing' },
    userPreferences: { type: 'object', description: 'User saved search criteria' },
  },
  execute: async (args) => {
    // Rule-based scoring for fast evaluation without extra AI calls
    let score = 0;
    const p = args.property;
    const prefs = args.userPreferences;

    if (prefs.type && p.type === prefs.type) score += 30;
    if (prefs.status && p.status === prefs.status) score += 20;
    if (prefs.location && p.location?.district?.toLowerCase().includes(prefs.location.toLowerCase())) score += 25;
    if (prefs.price_max && p.price <= prefs.price_max) score += 15;
    if (prefs.bedrooms_min && p.bedrooms >= prefs.bedrooms_min) score += 10;

    return { score, shouldNotify: score >= 50 };
  },
};

export interface NotificationMatch {
  userId: string;
  userName: string;
  userEmail: string;
  relevanceScore: number;
  reason: string;
}

export class NotificationAgent extends BaseAgent {
  protected name = 'NotificationAgent';
  protected model = 'gpt-3.5-turbo';
  protected maxSteps = 4;

  protected systemPrompt = `You are ImmoCI's Smart Notification Agent.
When a new property is listed, decide which users should be notified.

YOUR TASKS:
1. Call get_user_saved_searches to get users and their preferences.
2. For each user, call score_relevance to determine if the property matches.
3. Return a JSON list of users who should be notified (score >= 50).

RETURN FORMAT (valid JSON):
{
  "matches": [
    {
      "userId": "...",
      "userName": "...",
      "userEmail": "...",
      "relevanceScore": 85,
      "reason": "Matches your search: 3-bed villa in Cocody under 150M XOF"
    }
  ],
  "totalChecked": number,
  "totalMatches": number
}

Only include users with score >= 50. Keep reason concise and personal.`;

  protected tools = [getUserSavedSearchesTool, scoreRelevanceTool];

  async findMatches(newProperty: {
    id: string;
    title: string;
    price: number;
    type: string;
    status: string;
    bedrooms?: number;
    location: { city: string; district: string };
  }): Promise<{ matches: NotificationMatch[]; totalChecked: number; totalMatches: number }> {
    const prompt = `Find users to notify about this new listing:\n${JSON.stringify(newProperty, null, 2)}`;

    try {
      const raw = await this.run(prompt, { property: newProperty });
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {
      // fall through
    }

    return { matches: [], totalChecked: 0, totalMatches: 0 };
  }

  protected fallbackResponse(): string {
    return JSON.stringify({ matches: [], totalChecked: 0, totalMatches: 0 });
  }
}

export const notificationAgent = new NotificationAgent();
