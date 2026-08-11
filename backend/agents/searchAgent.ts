/**
 * Agent 1 — Smart Property Search Agent
 *
 * Multi-turn conversational agent that understands natural language queries
 * (French + English), maintains search context across messages, and returns
 * ranked property results with explanations.
 */
import { BaseAgent } from './BaseAgent';
import { searchPropertiesTool, getMarketStatsTool } from './tools/supabaseTools';

export class SearchAgent extends BaseAgent {
  protected name = 'SearchAgent';
  protected model = 'gpt-3.5-turbo';
  protected maxSteps = 5;

  protected systemPrompt = `You are ImmoCI's Smart Property Search Agent for Ivory Coast.
Your job is to help users find the perfect property using natural language.

RULES:
- Understand queries in both French and English.
- ALWAYS call search_properties with the extracted filters before answering.
- If results are found, summarize them clearly (title, price in XOF, location, bedrooms).
- If no results match, suggest relaxing one filter (e.g. increase budget or change district).
- Call get_market_stats to give the user context on price ranges when they ask about pricing.
- Never fabricate property listings — only report what the tools return.
- Be concise. Maximum 3–4 sentences of explanation + a bullet list of properties.
- Format prices as "X 000 000 XOF" or "X M XOF" for readability.

Districts in Abidjan to know: Cocody, Plateau, Marcory, Adjamé, Yopougon, Treichville, Koumassi, Abobo.`;

  protected tools = [searchPropertiesTool, getMarketStatsTool];

  protected fallbackResponse(userMessage: string): string {
    return `Je cherche des propriétés correspondant à votre demande : "${userMessage}". 
Le service IA est temporairement indisponible. Veuillez utiliser les filtres de recherche manuels.`;
  }
}

// Singleton export
export const searchAgent = new SearchAgent();
