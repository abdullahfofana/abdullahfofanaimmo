/**
 * Supabase query tools shared across multiple agents.
 * Each tool wraps a Supabase call and returns clean data.
 */
import { supabase } from '@/backend/supabase';
import type { AgentTool } from '../BaseAgent';

// ─── Tool: search_properties ─────────────────────────────────────────────────
export const searchPropertiesTool: AgentTool = {
  name: 'search_properties',
  description: 'Search the property database with optional filters. Returns matching listings.',
  parameters: {
    type: { type: 'string', description: 'Property type: apartment, house, villa, land, commercial', optional: true },
    status: { type: 'string', description: 'sale or rent', optional: true },
    location: { type: 'string', description: 'City or district name', optional: true },
    price_min: { type: 'number', description: 'Minimum price in XOF', optional: true },
    price_max: { type: 'number', description: 'Maximum price in XOF', optional: true },
    bedrooms_min: { type: 'number', description: 'Minimum number of bedrooms', optional: true },
    limit: { type: 'number', description: 'Max results to return (default 10)', optional: true },
  },
  execute: async (args) => {
    try {
      let query = supabase
        .from('properties')
        .select('id, title, price, type, status, bedrooms, area, location, photos, submissionStatus')
        .eq('submissionStatus', 'approved');

      if (args.type) query = (query as any).eq('type', args.type);
      if (args.status) query = (query as any).eq('status', args.status);
      if (args.price_min) query = (query as any).gte('price', args.price_min);
      if (args.price_max) query = (query as any).lte('price', args.price_max);
      if (args.bedrooms_min) query = (query as any).gte('bedrooms', args.bedrooms_min);
      if (args.location) {
        query = (query as any).ilike('location->>district', `%${args.location}%`);
      }

      const { data, error } = await (query as any).limit(args.limit ?? 10);
      if (error) return { properties: [], error: error.message };
      return { properties: data ?? [], count: data?.length ?? 0 };
    } catch (e: any) {
      return { properties: [], error: e.message };
    }
  },
};

// ─── Tool: get_market_stats ──────────────────────────────────────────────────
export const getMarketStatsTool: AgentTool = {
  name: 'get_market_stats',
  description: 'Get price statistics for a property type and location from the database.',
  parameters: {
    type: { type: 'string', description: 'Property type', optional: true },
    location: { type: 'string', description: 'City or district', optional: true },
    status: { type: 'string', description: 'sale or rent', optional: true },
  },
  execute: async (args) => {
    try {
      let query = supabase
        .from('properties')
        .select('price, bedrooms, area, location, type, status')
        .eq('submissionStatus', 'approved');

      if (args.type) query = (query as any).eq('type', args.type);
      if (args.status) query = (query as any).eq('status', args.status);
      if (args.location) query = (query as any).ilike('location->>district', `%${args.location}%`);

      const { data, error } = await (query as any).limit(100);
      if (error || !data?.length) return { stats: null, sampleSize: 0 };

      const prices = data.map((p: any) => p.price).filter(Boolean);
      const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const median = prices.sort((a: number, b: number) => a - b)[Math.floor(prices.length / 2)];

      return {
        stats: { avg: Math.round(avg), min, max, median, currency: 'XOF' },
        sampleSize: prices.length,
        type: args.type,
        location: args.location,
      };
    } catch (e: any) {
      return { stats: null, error: e.message };
    }
  },
};

// ─── Tool: get_property_by_id ─────────────────────────────────────────────────
export const getPropertyByIdTool: AgentTool = {
  name: 'get_property_by_id',
  description: 'Fetch full details of a property by its ID.',
  parameters: {
    id: { type: 'string', description: 'Property UUID' },
  },
  execute: async (args) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', args.id)
        .single();
      if (error) return { property: null, error: error.message };
      return { property: data };
    } catch (e: any) {
      return { property: null, error: e.message };
    }
  },
};

// ─── Tool: check_duplicate_listings ──────────────────────────────────────────
export const checkDuplicatesTool: AgentTool = {
  name: 'check_duplicate_listings',
  description: 'Check if a similar property already exists in the database by address and price.',
  parameters: {
    address: { type: 'string', description: 'Property address or district' },
    price: { type: 'number', description: 'Listing price in XOF' },
    type: { type: 'string', description: 'Property type', optional: true },
  },
  execute: async (args) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, price, location, type, submittedAt')
        .ilike('location->>address', `%${args.address}%`)
        .limit(5) as any;

      if (error) return { duplicates: [], isDuplicate: false };

      const similar = (data ?? []).filter((p: any) => {
        const priceDiff = Math.abs(p.price - args.price) / args.price;
        return priceDiff < 0.15; // within 15% price range
      });

      return {
        duplicates: similar,
        isDuplicate: similar.length > 0,
        count: similar.length,
      };
    } catch (e: any) {
      return { duplicates: [], isDuplicate: false, error: e.message };
    }
  },
};

// ─── Tool: get_platform_analytics ─────────────────────────────────────────────
export const getPlatformAnalyticsTool: AgentTool = {
  name: 'get_platform_analytics',
  description: 'Retrieve aggregated platform metrics: total properties, users, pending reviews.',
  parameters: {},
  execute: async () => {
    try {
      const [propResult, userResult, pendingResult] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }) as any,
        supabase.from('users').select('id', { count: 'exact', head: true }) as any,
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('submissionStatus', 'pending') as any,
      ]);

      return {
        totalProperties: propResult.count ?? 0,
        totalUsers: userResult.count ?? 0,
        pendingReviews: pendingResult.count ?? 0,
        timestamp: new Date().toISOString(),
      };
    } catch (e: any) {
      return { error: e.message };
    }
  },
};

// ─── Tool: get_user_saved_searches ───────────────────────────────────────────
export const getUserSavedSearchesTool: AgentTool = {
  name: 'get_user_saved_searches',
  description: 'Get all users with saved search criteria for notification matching.',
  parameters: {
    limit: { type: 'number', description: 'Max users to fetch', optional: true },
  },
  execute: async (args) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name')
        .limit(args.limit ?? 50) as any;

      if (error) return { users: [] };
      return { users: data ?? [] };
    } catch (e: any) {
      return { users: [], error: e.message };
    }
  },
};
