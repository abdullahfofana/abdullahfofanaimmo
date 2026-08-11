/**
 * Agent Index — single import point for all ImmoCI agents.
 *
 * Usage:
 *   import { searchAgent, pricingAgent, fraudDetectionAgent } from '@/backend/agents';
 */

export { searchAgent, SearchAgent } from './searchAgent';
export { submissionReviewAgent, SubmissionReviewAgent } from './submissionReviewAgent';
export type { ReviewResult } from './submissionReviewAgent';

export { pricingAgent, PricingAgent } from './pricingAgent';
export type { PriceEstimate } from './pricingAgent';

export { notificationAgent, NotificationAgent } from './notificationAgent';
export type { NotificationMatch } from './notificationAgent';

export { sellerAssistantAgent, SellerAssistantAgent } from './sellerAssistantAgent';

export { analyticsAgent, AnalyticsAgent } from './analyticsAgent';
export type { AdminInsights } from './analyticsAgent';

export { neighborhoodAgent, NeighborhoodAgent } from './neighborhoodAgent';
export type { NeighborhoodReport } from './neighborhoodAgent';

export { fraudDetectionAgent, FraudDetectionAgent } from './fraudDetectionAgent';
export type { FraudReport } from './fraudDetectionAgent';

export { BaseAgent, getOpenAI } from './BaseAgent';
export type { AgentTool, AgentMessage } from './BaseAgent';
