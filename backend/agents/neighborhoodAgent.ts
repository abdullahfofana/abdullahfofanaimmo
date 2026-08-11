/**
 * Agent 7 — Neighborhood Discovery Agent
 *
 * Provides rich neighborhood context for a property location:
 * amenities, safety, transport, pros/cons, and comparisons.
 */
import { BaseAgent } from './BaseAgent';
import { searchPropertiesTool, getMarketStatsTool } from './tools/supabaseTools';
import type { AgentTool } from './BaseAgent';

// Static knowledge base for Abidjan neighborhoods
const ABIDJAN_NEIGHBORHOODS: Record<string, any> = {
  cocody: {
    safety: 'high',
    vibe: 'Upscale residential — embassies, universities, luxury villas.',
    transport: 'Well connected via Boulevard Latrille and Route d\'Abidjan.',
    amenities: ['Université FHB', 'Centre Commercial Cosmos', 'Restaurants haut de gamme', 'Cliniques privées'],
    bestFor: 'Families, expats, luxury buyers',
    priceIndex: 'premium',
  },
  plateau: {
    safety: 'high',
    vibe: 'Business & administrative center — banks, ministries, offices.',
    transport: 'Excellent — lagoon boats, taxis, central location.',
    amenities: ['Banques', 'Hôtel Ivoire', 'BCEAO', 'Palais de Justice'],
    bestFor: 'Commercial tenants, business owners',
    priceIndex: 'premium',
  },
  marcory: {
    safety: 'medium-high',
    vibe: 'Mixed residential-commercial — active and accessible.',
    transport: 'Good — Zone 4 access, taxis, gbaka.',
    amenities: ['Marché Marcory', 'Zone 4 nightlife', 'Collèges internationaux'],
    bestFor: 'Young professionals, mid-range renters',
    priceIndex: 'mid-range',
  },
  yopougon: {
    safety: 'medium',
    vibe: 'Largest commune — vibrant, dense, culturally rich.',
    transport: 'Woro-woro, gbaka, limited formal transit.',
    amenities: ['Grand marché', 'Écoles publiques', 'Centres de santé'],
    bestFor: 'Budget buyers, large families',
    priceIndex: 'affordable',
  },
  treichville: {
    safety: 'medium',
    vibe: 'Historic port area — commerce and culture.',
    transport: 'Ferry, taxis, central.',
    amenities: ['Port d\'Abidjan', 'Marché Treichville', 'Stade Félix Houphouët'],
    bestFor: 'Commercial, budget apartments',
    priceIndex: 'affordable',
  },
  adjame: {
    safety: 'medium',
    vibe: 'Commercial hub — markets, trade, transit point.',
    transport: 'Excellent — Adjamé is Abidjan\'s transport center.',
    amenities: ['Grand marché d\'Adjamé', 'Gare routière', 'Marché de gros'],
    bestFor: 'Commercial properties, transit workers',
    priceIndex: 'affordable',
  },
};

// Tool: get_neighborhood_data
const getNeighborhoodDataTool: AgentTool = {
  name: 'get_neighborhood_data',
  description: 'Get detailed neighborhood information for an Abidjan district.',
  parameters: {
    district: { type: 'string', description: 'District/neighborhood name' },
  },
  execute: async (args) => {
    const key = args.district?.toLowerCase().trim();
    const data = ABIDJAN_NEIGHBORHOODS[key];
    if (!data) {
      return {
        found: false,
        message: `No detailed data for "${args.district}". General info: Ivory Coast has a growing real estate market with strong demand in urban areas.`,
      };
    }
    return { found: true, district: args.district, ...data };
  },
};

// Tool: compare_neighborhoods
const compareNeighborhoodsTool: AgentTool = {
  name: 'compare_neighborhoods',
  description: 'Compare two Abidjan neighborhoods side by side.',
  parameters: {
    district1: { type: 'string', description: 'First district name' },
    district2: { type: 'string', description: 'Second district name' },
  },
  execute: async (args) => {
    const d1 = ABIDJAN_NEIGHBORHOODS[args.district1?.toLowerCase()];
    const d2 = ABIDJAN_NEIGHBORHOODS[args.district2?.toLowerCase()];
    return {
      comparison: {
        [args.district1]: d1 ?? { found: false },
        [args.district2]: d2 ?? { found: false },
      },
    };
  },
};

export interface NeighborhoodReport {
  district: string;
  summary: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  safetyRating: string;
  priceIndex: string;
  recommendation: string;
}

export class NeighborhoodAgent extends BaseAgent {
  protected name = 'NeighborhoodAgent';
  protected model = 'gpt-3.5-turbo';
  protected maxSteps = 4;

  protected systemPrompt = `You are ImmoCI's Neighborhood Discovery Agent for Abidjan, Ivory Coast.
Help property seekers understand neighborhoods before they commit.

TASKS:
1. Call get_neighborhood_data for the requested district.
2. Call get_market_stats to show price context.
3. If comparing two areas, call compare_neighborhoods.
4. Generate a friendly, helpful neighborhood report.

RETURN FORMAT (valid JSON):
{
  "district": "name",
  "summary": "2-3 sentence neighborhood overview",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "bestFor": "who this neighborhood suits best",
  "safetyRating": "low|medium|high",
  "priceIndex": "affordable|mid-range|premium",
  "recommendation": "personalized advice for the buyer"
}

Tone: friendly, informative, honest. Don't oversell any neighborhood.
Respond in the same language as the user (FR or EN).`;

  protected tools = [getNeighborhoodDataTool, compareNeighborhoodsTool, getMarketStatsTool, searchPropertiesTool];

  async getReport(district: string, userProfile?: { budget?: number; type?: string }): Promise<NeighborhoodReport> {
    const prompt = `Tell me about the "${district}" neighborhood for a property buyer.${userProfile ? ` User profile: ${JSON.stringify(userProfile)}` : ''}`;

    try {
      const raw = await this.run(prompt, { district, userProfile });
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      // fall through
    }

    return {
      district,
      summary: `${district} is a neighborhood in Abidjan, Ivory Coast.`,
      pros: ['Located in Abidjan', 'Access to urban amenities'],
      cons: ['Detailed data unavailable'],
      bestFor: 'Various buyer profiles',
      safetyRating: 'medium',
      priceIndex: 'mid-range',
      recommendation: 'Visit the neighborhood in person before making a decision.',
    };
  }

  protected fallbackResponse(userMessage: string): string {
    return `Information sur le quartier demandé est temporairement indisponible. Veuillez consulter notre guide des quartiers d'Abidjan dans l'onglet Aide.`;
  }
}

export const neighborhoodAgent = new NeighborhoodAgent();
