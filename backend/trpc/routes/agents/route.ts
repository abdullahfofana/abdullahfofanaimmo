/**
 * tRPC Agents Router
 * Exposes all 8 AI agents as typed API endpoints.
 */
import { z } from 'zod';
import { createTRPCRouter, authedProcedure, publicProcedure } from '../../create-context';

import { searchAgent } from '@/backend/agents/searchAgent';
import { submissionReviewAgent } from '@/backend/agents/submissionReviewAgent';
import { pricingAgent } from '@/backend/agents/pricingAgent';
import { notificationAgent } from '@/backend/agents/notificationAgent';
import { sellerAssistantAgent } from '@/backend/agents/sellerAssistantAgent';
import { analyticsAgent } from '@/backend/agents/analyticsAgent';
import { neighborhoodAgent } from '@/backend/agents/neighborhoodAgent';
import { fraudDetectionAgent } from '@/backend/agents/fraudDetectionAgent';

const LocationSchema = z.object({
  address: z.string().max(300).optional().default(''),
  city: z.string().max(100),
  district: z.string().max(100),
});

const PropertySubmissionSchema = z.object({
  title: z.string().max(300),
  description: z.string().max(5000),
  price: z.number().positive(),
  type: z.enum(['apartment', 'house', 'villa', 'land', 'commercial']),
  status: z.enum(['sale', 'rent']),
  location: LocationSchema,
  photos: z.array(z.string().url()).max(10).default([]),
  features: z.array(z.string().max(100)).max(30).optional().default([]),
  agent: z.object({
    name: z.string().max(200),
    phone: z.string().max(30).optional(),
  }).optional(),
  bedrooms: z.number().int().min(0).max(30).optional(),
  bathrooms: z.number().int().min(0).max(30).optional(),
  area: z.number().positive().max(100_000).optional(),
});

export const agentsRouter = createTRPCRouter({

  // ── Agent 1: Smart Search ─────────────────────────────────────────────────
  search: authedProcedure
    .input(z.object({
      message: z.string().min(1).max(500),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })).max(20).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      const response = await searchAgent.run(input.message);
      return { reply: response, agent: 'SearchAgent' };
    }),

  // ── Agent 2: Submission Review ─────────────────────────────────────────────
  reviewSubmission: authedProcedure
    .input(z.object({ property: PropertySubmissionSchema }))
    .mutation(async ({ input }) => {
      const review = await submissionReviewAgent.review({
        ...input.property,
        location: {
          address: input.property.location.address,
          city: input.property.location.city,
          district: input.property.location.district,
        },
        agent: input.property.agent ?? { name: 'Unknown' },
      });
      return { review, agent: 'SubmissionReviewAgent' };
    }),

  // ── Agent 3: Price Intelligence ────────────────────────────────────────────
  estimatePrice: authedProcedure
    .input(z.object({
      type: z.enum(['apartment', 'house', 'villa', 'land', 'commercial']),
      status: z.enum(['sale', 'rent']),
      location: z.object({ city: z.string(), district: z.string() }),
      bedrooms: z.number().int().min(0).max(30).optional(),
      bathrooms: z.number().int().min(0).max(30).optional(),
      area: z.number().positive().optional(),
      features: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const estimate = await pricingAgent.estimate(input);
      return { estimate, agent: 'PricingAgent' };
    }),

  // ── Agent 4: Notification Matching ────────────────────────────────────────
  findNotificationMatches: authedProcedure
    .input(z.object({
      property: z.object({
        id: z.string(),
        title: z.string(),
        price: z.number(),
        type: z.string(),
        status: z.string(),
        bedrooms: z.number().optional(),
        location: z.object({ city: z.string(), district: z.string() }),
      }),
    }))
    .mutation(async ({ input }) => {
      const result = await notificationAgent.findMatches(input.property);
      return { ...result, agent: 'NotificationAgent' };
    }),

  // ── Agent 5: Seller Assistant ──────────────────────────────────────────────
  sellerChat: authedProcedure
    .input(z.object({
      message: z.string().min(1).max(1000),
      listingContext: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await sellerAssistantAgent.run(input.message, input.listingContext);
      return { reply: response, agent: 'SellerAssistantAgent' };
    }),

  // ── Agent 6: Admin Analytics ───────────────────────────────────────────────
  generateAnalyticsReport: authedProcedure
    .input(z.object({
      additionalContext: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const report = await analyticsAgent.generateReport(input.additionalContext);
      return { report, agent: 'AnalyticsAgent' };
    }),

  // ── Agent 7: Neighborhood Discovery ──────────────────────────────────────
  getNeighborhoodInfo: publicProcedure
    .input(z.object({
      district: z.string().min(1).max(100),
      userProfile: z.object({
        budget: z.number().optional(),
        type: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      const report = await neighborhoodAgent.getReport(input.district, input.userProfile);
      return { report, agent: 'NeighborhoodAgent' };
    }),

  neighborhoodChat: authedProcedure
    .input(z.object({
      message: z.string().min(1).max(500),
      district: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await neighborhoodAgent.run(input.message, { district: input.district });
      return { reply: response, agent: 'NeighborhoodAgent' };
    }),

  // ── Agent 8: Fraud Detection ───────────────────────────────────────────────
  analyzeFraud: authedProcedure
    .input(z.object({ property: PropertySubmissionSchema }))
    .mutation(async ({ input }) => {
      const report = await fraudDetectionAgent.analyze({
        ...input.property,
        location: {
          address: input.property.location.address,
          city: input.property.location.city,
          district: input.property.location.district,
        },
        agent: input.property.agent ?? { name: 'Unknown' },
      });
      return { report, agent: 'FraudDetectionAgent' };
    }),
});
