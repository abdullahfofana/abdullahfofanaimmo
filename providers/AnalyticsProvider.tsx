import createContextHook from '@nkzw/create-context-hook';
import { useMemo } from 'react';

// ─── Static fallback data (used when backend is unavailable) ───────────────
const FALLBACK_REVENUE_DATA = [
  { month: 'Jan', revenue: 14500000 },
  { month: 'Feb', revenue: 17200000 },
  { month: 'Mar', revenue: 20800000 },
  { month: 'Apr', revenue: 18900000 },
  { month: 'May', revenue: 24300000 },
  { month: 'Jun', revenue: 27800000 },
];

const FALLBACK_DISTRIBUTION = [
  { type: 'Villas', count: 45, percentage: 45, color: '#3B82F6' },
  { type: 'Apartments', count: 30, percentage: 30, color: '#10B981' },
  { type: 'Commercial', count: 15, percentage: 15, color: '#F59E0B' },
  { type: 'Land', count: 10, percentage: 10, color: '#8B5CF6' },
];

const FALLBACK_USER_GROWTH = [
  { month: 'Jan', properties: 12, users: 45 },
  { month: 'Feb', properties: 18, users: 52 },
  { month: 'Mar', properties: 25, users: 78 },
  { month: 'Apr', properties: 30, users: 95 },
  { month: 'May', properties: 42, users: 120 },
  { month: 'Jun', properties: 55, users: 148 },
];

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
    // Use static fallback data — tRPC backend is not available on Vercel static export
    const analytics = useMemo(() => {
        return {
            kpis: {
                totalProperties: 212,
                totalRevenue: 123100000,
                activeUsers: 538,
                pendingVerifications: 14,
                revenueGrowth: 12.5,
                userGrowth: 8.2,
                propertyGrowth: 5.4,
            },
            charts: {
                revenue: FALLBACK_REVENUE_DATA,
                distribution: FALLBACK_DISTRIBUTION,
                userGrowth: FALLBACK_USER_GROWTH,
            },
        };
    }, []);

    return analytics;
});
