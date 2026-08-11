/**
 * Agent 3 — Market Price Intelligence Agent
 *
 * Uses real Supabase data to generate accurate price estimates for Ivory Coast
 * properties. Returns a price range, confidence score, and market context.
 */
import { BaseAgent } from './BaseAgent';
import { getMarketStatsTool, searchPropertiesTool } from './tools/supabaseTools';

export interface PriceEstimate {
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: 'low' | 'medium' | 'high';
  marketContext: string;
  comparables: number; // number of comparable listings found
  recommendation: string;
  currency: 'XOF';
}

export class PricingAgent extends BaseAgent {
  protected name = 'PricingAgent';
  protected model = 'gpt-3.5-turbo';
  protected maxSteps = 4;

  protected systemPrompt = `You are ImmoCI's Market Price Intelligence Agent for Ivory Coast real estate.

YOUR TASKS:
1. Call get_market_stats to retrieve real price data for the property type and location.
2. Optionally call search_properties to find comparable listings.
3. Based on real market data, estimate a fair price.

RETURN FORMAT (always valid JSON):
{
  "estimatedPrice": number (in XOF),
  "priceRange": { "min": number, "max": number },
  "confidence": "low" | "medium" | "high",
  "marketContext": "brief explanation of the market",
  "comparables": number,
  "recommendation": "actionable advice for the seller/buyer",
  "currency": "XOF"
}

CONFIDENCE LEVELS:
- high: 15+ comparable listings found
- medium: 5–14 comparables
- low: < 5 comparables (rely more on general knowledge of CI market)

IMPORTANT: Always ground your estimate in the tool data. If no data is available,
use general knowledge of Abidjan's real estate market (premium: Cocody/Plateau,
mid-range: Marcory/Treichville, affordable: Yopougon/Abobo).`;

  protected tools = [getMarketStatsTool, searchPropertiesTool];

  async estimate(details: {
    type: string;
    status: string;
    location: { city: string; district: string };
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    features?: string[];
  }): Promise<PriceEstimate> {
    const prompt = `Estimate the price for this property:\n${JSON.stringify(details, null, 2)}`;

    try {
      const raw = await this.run(prompt, { propertyDetails: details });
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          estimatedPrice: parsed.estimatedPrice ?? 0,
          priceRange: parsed.priceRange ?? { min: 0, max: 0 },
          confidence: parsed.confidence ?? 'low',
          marketContext: parsed.marketContext ?? '',
          comparables: parsed.comparables ?? 0,
          recommendation: parsed.recommendation ?? '',
          currency: 'XOF',
        };
      }
    } catch {
      // fall through
    }

    return {
      estimatedPrice: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 'low',
      marketContext: 'Estimation unavailable — please check market rates manually.',
      comparables: 0,
      recommendation: 'Contact a local agent for a precise valuation.',
      currency: 'XOF',
    };
  }

  protected fallbackResponse(): string {
    return JSON.stringify({
      estimatedPrice: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 'low',
      marketContext: 'AI offline — estimation unavailable.',
      comparables: 0,
      recommendation: 'Please try again later.',
      currency: 'XOF',
    });
  }
}

export const pricingAgent = new PricingAgent();
