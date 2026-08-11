/**
 * Agent 5 — Seller & Agent Assistant
 *
 * Dedicated AI assistant for property agents and sellers.
 * Helps improve listings, optimize pricing, track performance, and answer
 * platform-specific questions.
 */
import { BaseAgent } from './BaseAgent';
import { getMarketStatsTool, searchPropertiesTool } from './tools/supabaseTools';
import type { AgentTool } from './BaseAgent';

// Tool: analyze_listing_quality
const analyzeListingQualityTool: AgentTool = {
  name: 'analyze_listing_quality',
  description: 'Analyze the quality of a property listing and return improvement tips.',
  parameters: {
    title: { type: 'string', description: 'Listing title' },
    description: { type: 'string', description: 'Listing description' },
    photos: { type: 'number', description: 'Number of photos uploaded' },
    price: { type: 'number', description: 'Listed price in XOF' },
    features: { type: 'array', description: 'List of property features', items: { type: 'string' }, optional: true },
  },
  execute: async (args) => {
    const issues: string[] = [];
    let score = 10;

    if (!args.title || args.title.length < 20) { issues.push('Title is too short — add location and key feature.'); score -= 2; }
    if (!args.description || args.description.length < 80) { issues.push('Description is too short — buyers want details.'); score -= 3; }
    if ((args.photos ?? 0) < 3) { issues.push(`Only ${args.photos ?? 0} photo(s) — add at least 3 for 3x more views.`); score -= 2; }
    if (!args.features || args.features.length < 3) { issues.push('Add more features (pool, parking, generator...).'); score -= 1; }

    return {
      qualityScore: Math.max(1, score),
      issues,
      tip: issues.length === 0 ? 'Great listing! You\'re ready to publish.' : `Fix ${issues.length} issue(s) to boost visibility.`,
    };
  },
};

// Tool: get_listing_tips
const getListingTipsTool: AgentTool = {
  name: 'get_listing_tips',
  description: 'Return best practices for listing a specific property type in a location.',
  parameters: {
    type: { type: 'string', description: 'Property type' },
    location: { type: 'string', description: 'District or city' },
  },
  execute: async (args) => {
    // Static tips database (can be extended)
    const tips: Record<string, string[]> = {
      villa: ['Highlight the pool and garden.', 'Show exterior and night shots.', 'Mention security features.'],
      apartment: ['Show the view from windows.', 'Highlight proximity to transport.', 'Mention floor number.'],
      house: ['Show the neighbourhood.', 'Highlight the compound/fence.', 'Mention water/electricity access.'],
      land: ['Add GPS coordinates.', 'Show boundary markers.', 'Mention utilities availability.'],
      commercial: ['State the current use.', 'Highlight foot traffic.', 'Mention lease terms.'],
    };
    const locationTips: Record<string, string> = {
      'cocody': 'Cocody listings perform best with premium staging photos.',
      'plateau': 'Plateau commercial listings attract business tenants — emphasize accessibility.',
      'yopougon': 'Yopougon buyers prioritize price-to-space ratio — highlight room count.',
    };

    return {
      tips: tips[args.type?.toLowerCase()] ?? ['Use high quality photos.', 'Write a detailed description.'],
      locationInsight: locationTips[args.location?.toLowerCase()] ?? 'Use local market comparisons in your description.',
    };
  },
};

export class SellerAssistantAgent extends BaseAgent {
  protected name = 'SellerAssistantAgent';
  protected model = 'gpt-3.5-turbo';
  protected maxSteps = 5;

  protected systemPrompt = `You are ImmoCI's Seller & Agent Assistant — a dedicated AI for property sellers and real estate agents.

PERSONA: Professional, data-driven, supportive. Speak like a top real estate advisor.

CAPABILITIES:
- Help sellers write compelling listings
- Analyze listing quality and suggest improvements  
- Answer pricing questions using real market data
- Give tips on how to sell faster in specific Abidjan neighborhoods
- Explain platform features (how to list, payment methods, photo upload)

ALWAYS:
- Use tools to back up advice with data
- Keep answers practical and action-oriented
- Respond in the same language as the user (FR or EN)

DO NOT: give legal advice or guarantee sale outcomes.`;

  protected tools = [analyzeListingQualityTool, getListingTipsTool, getMarketStatsTool, searchPropertiesTool];

  protected fallbackResponse(userMessage: string): string {
    return `Merci pour votre question : "${userMessage}". 
Notre assistant IA est temporairement indisponible. Consultez notre guide de vente dans l'onglet Aide.`;
  }
}

export const sellerAssistantAgent = new SellerAssistantAgent();
