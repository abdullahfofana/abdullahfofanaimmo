import { z } from "zod";
import { createTRPCRouter, authedProcedure } from "../../create-context";
import {
    chatWithAI,
    parseSearchQuery,
    moderateProperty,
    generateDescription,
    estimatePrice,
    analyzeData
} from "@/backend/ai";

// Typed schemas for AI inputs — prevents oversized payloads & prompt injection
const PropertyModerateSchema = z.object({
    title: z.string().max(300),
    description: z.string().max(3000),
    price: z.number().positive().optional(),
    type: z.enum(['apartment', 'house', 'villa', 'land', 'commercial']).optional(),
    location: z.object({
        city: z.string().max(100),
        district: z.string().max(100),
    }).optional(),
    features: z.array(z.string().max(100)).max(20).optional(),
});

const PropertyDetailsSchema = z.object({
    title: z.string().max(300).optional(),
    type: z.enum(['apartment', 'house', 'villa', 'land', 'commercial']).optional(),
    bedrooms: z.number().int().min(0).max(20).optional(),
    bathrooms: z.number().int().min(0).max(20).optional(),
    area: z.number().positive().max(100000).optional(),
    location: z.object({
        city: z.string().max(100),
        district: z.string().max(100),
    }).optional(),
    features: z.array(z.string().max(100)).max(20).optional(),
});

const KPIDataSchema = z.object({
    totalProperties: z.number().optional(),
    activeUsers: z.number().optional(),
    totalRevenue: z.number().optional(),
    pendingVerifications: z.number().optional(),
    propertyGrowth: z.number().optional(),
    userGrowth: z.number().optional(),
    revenueGrowth: z.number().optional(),
});

export const aiRouter = createTRPCRouter({

    // 1. General Chatbot
    chat: authedProcedure
        .input(z.object({
            messages: z.array(z.object({
                role: z.enum(['user', 'system', 'assistant']),
                content: z.string()
            }))
        }))
        .mutation(async ({ input }) => {
            try {
                const lastMessage = input.messages[input.messages.length - 1]?.content ?? '';
                const response = await chatWithAI(lastMessage);
                return { message: response };
            } catch (error) {
                console.error('AI Chat Error:', error);
                return {
                    message: {
                        role: 'assistant',
                        content: "I'm having trouble connecting to my AI services right now. Please try again later."
                    }
                };
            }
        }),

    // 2. Natural Language Search
    parseSearch: authedProcedure
        .input(z.object({
            query: z.string()
        }))
        .mutation(async ({ input }) => {
            try {
                const filters = await parseSearchQuery(input.query);
                return { filters, success: !!filters };
            } catch (error) {
                return { filters: null, success: false, error: 'Failed to parse query' };
            }
        }),

    // 3. Smart Moderation
    moderate: authedProcedure
        .input(z.object({
            property: PropertyModerateSchema
        }))
        .mutation(async ({ input }) => {
            const result = await moderateProperty(input.property);
            return result;
        }),

    // 4. Generate Description
    generateDescription: authedProcedure
        .input(z.object({
            details: PropertyDetailsSchema
        }))
        .mutation(async ({ input }) => {
            const description = await generateDescription(input.details);
            return { description };
        }),

    // 5. Price Estimation
    estimatePrice: authedProcedure
        .input(z.object({
            details: PropertyDetailsSchema
        }))
        .mutation(async ({ input }) => {
            const estimation = await estimatePrice(input.details);
            return { estimation };
        }),

    // 6. Dashboard Analytics Assistant
    analyzeKPIs: authedProcedure
        .input(z.object({
            data: KPIDataSchema,
            question: z.string().max(500)
        }))
        .mutation(async ({ input }) => {
            const answer = await analyzeData(input.data);
            return { answer };
        }),
});
