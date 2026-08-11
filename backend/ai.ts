import OpenAI from 'openai';

// Server-only: never prefix with EXPO_PUBLIC_ — that would expose the key in the client bundle
const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

let openai: OpenAI | null = null;
let aiInitialized = false;

const initializeAI = () => {
    if (aiInitialized) return;

    if (apiKey) {
        try {
            openai = new OpenAI({
                apiKey: apiKey,
                // dangerouslyAllowBrowser removed — this module runs server-side only (Hono/tRPC)
            });
            aiInitialized = true;
        } catch (error) {
            console.warn('[AI Service] Failed to initialize OpenAI SDK');
        }
    } else {
        console.warn('[AI Service] OPENAI_API_KEY is not set. AI features will use smart mock responses.');
        aiInitialized = true;
    }
};

export const chatWithAI = async (message: string, context?: any) => {
    initializeAI();

    if (!openai) {
        return {
            role: 'assistant',
            content: "I'm currently running in offline mode. I can help you browse properties, but I can't answer complex questions right now.",
        };
    }

    try {
        const systemPrompt = `You are a helpful AI assistant for ImmoCI, a real estate platform in Ivory Coast.
    Context: ${JSON.stringify(context || {})}
    
    Be concise, helpful, and professional. 
    If the user asks about properties, use the provided context.
    If the user asks about the platform, explain that ImmoCI helps buy, sell, and rent properties.
    `;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            model: 'gpt-3.5-turbo',
            max_tokens: 150,
        });

        return completion.choices[0].message;
    } catch (error) {
        console.error('[AI Service] Chat error:', error);
        return {
            role: 'assistant',
            content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.",
        };
    }
};

export const parseSearchQuery = async (query: string) => {
    initializeAI();

    if (!openai) {
        const lower = query.toLowerCase();
        return {
            type: lower.includes('house') ? 'house' : lower.includes('apartment') ? 'apartment' : undefined,
            price_max: lower.includes('budget') ? parseInt(lower.split('budget')[1]) : undefined,
            location: lower.includes('in ') ? lower.split('in ')[1].split(' ')[0] : undefined,
        };
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'Extract search parameters (type, price_min, price_max, location, bedrooms) from the user query. Return JSON only.' },
                { role: 'user', content: query }
            ],
            model: 'gpt-3.5-turbo',
            response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
        console.error('[AI Service] Search parse error:', error);
        return {};
    }
};

export const moderateProperty = async (property: any) => {
    initializeAI();
    if (!openai) return { approved: true, reason: 'Auto-approved (AI offline)' };

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a content moderator for a real estate platform. Review the property listing for inappropriate content, scams, or policy violations. Return JSON with "approved" (boolean) and "reason" (string).' },
                { role: 'user', content: JSON.stringify(property) }
            ],
            model: 'gpt-3.5-turbo',
            response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0].message.content || '{"approved": true}');
    } catch (error) {
        console.error('[AI Service] Moderation error:', error);
        return { approved: true, reason: 'Auto-approved (Error)' };
    }
};

export const generateDescription = async (features: any) => {
    initializeAI();
    if (!openai) return "A beautiful property with great features. Contact us for more details.";

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'Generate a compelling property description based on these features. Keep it under 100 words.' },
                { role: 'user', content: JSON.stringify(features) }
            ],
            model: 'gpt-3.5-turbo',
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('[AI Service] Description gen error:', error);
        return "A beautiful property with great features. Contact us for more details.";
    }
};

export const estimatePrice = async (details: any) => {
    initializeAI();
    if (!openai) return null;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'Estimate the price for this property in XOF (CFA Francs) based on current market trends in Ivory Coast. Return JSON with "estimatedPrice" (number) and "confidence" (low/medium/high).' },
                { role: 'user', content: JSON.stringify(details) }
            ],
            model: 'gpt-3.5-turbo',
            response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
        console.error('[AI Service] Price estimation error:', error);
        return null;
    }
};

export const analyzeData = async (data: any) => {
    initializeAI();
    if (!openai) return { insights: ["Data analysis unavailable offline"] };

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'Analyze this real estate data and provide 3 key insights/trends. Return JSON with "insights" array.' },
                { role: 'user', content: JSON.stringify(data) }
            ],
            model: 'gpt-3.5-turbo',
            response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0].message.content || '{"insights": []}');
    } catch (error) {
        console.error('[AI Service] Analysis error:', error);
        return { insights: [] };
    }
};
