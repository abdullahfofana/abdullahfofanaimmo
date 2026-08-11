import { supabase, USE_SUPABASE } from '@/backend/db';

export interface SearchIntent {
  id: string;
  userId: string;
  criteria: {
    query?: string;
    type?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number | string;
    bathrooms?: number | string;
  };
  createdAt: number;
}

export interface MatchNotification {
  id: string;
  userId: string;
  propertyId: string;
  propertyTitle: string;
  matchReason: string;
  timestamp: number;
  read: boolean;
}

// ─── In-memory fallback (used when Supabase is not configured) ───────────────
const _intents: SearchIntent[] = [];
const _notifications: MatchNotification[] = [];

export const SearchMatchingService = {
  saveIntent: async (intent: Omit<SearchIntent, 'id' | 'createdAt'>) => {
    const newIntent: SearchIntent = {
      ...intent,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    if (USE_SUPABASE) {
      try {
        await supabase.from('search_intents').insert({
          id: newIntent.id,
          user_id: newIntent.userId,
          criteria: newIntent.criteria,
          created_at: newIntent.createdAt,
        });
        return newIntent;
      } catch (e) {
        console.warn('[SearchMatchingService] Supabase insert failed, using in-memory fallback');
      }
    }

    _intents.push(newIntent);
    return newIntent;
  },

  getNotifications: async (userId: string): Promise<MatchNotification[]> => {
    if (USE_SUPABASE) {
      try {
        const { data, error } = await supabase
          .from('match_notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('read', false)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (!error && data) {
          return data.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            propertyId: n.property_id,
            propertyTitle: n.property_title,
            matchReason: n.match_reason,
            timestamp: n.timestamp,
            read: n.read,
          }));
        }
      } catch (e) {
        console.warn('[SearchMatchingService] Supabase fetch failed, using in-memory fallback');
      }
    }

    return _notifications.filter((n) => n.userId === userId && !n.read);
  },

  markAsRead: async (notificationId: string) => {
    if (USE_SUPABASE) {
      try {
        await supabase
          .from('match_notifications')
          .update({ read: true })
          .eq('id', notificationId);
        return;
      } catch (e) {
        console.warn('[SearchMatchingService] Supabase update failed, using in-memory fallback');
      }
    }

    const index = _notifications.findIndex((n) => n.id === notificationId);
    if (index !== -1) _notifications[index].read = true;
  },

  checkMatches: async (property: any) => {
    console.log('[SearchMatchingService] Checking matches for property:', property.title);

    // Load candidate intents from Supabase (or in-memory fallback)
    let candidates: SearchIntent[] = [];

    if (USE_SUPABASE) {
      try {
        const { data } = await supabase
          .from('search_intents')
          .select('id, user_id, criteria, created_at')
          .limit(200);

        if (data) {
          candidates = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            criteria: row.criteria,
            createdAt: row.created_at,
          }));
        }
      } catch (e) {
        console.warn('[SearchMatchingService] Supabase fetch failed, using in-memory fallback');
        candidates = [..._intents];
      }
    } else {
      candidates = [..._intents];
    }

    // Filter by basic type & price criteria before any expensive operations
    const filtered = candidates.filter((intent) => {
      if (intent.criteria.type && intent.criteria.type !== 'all' && intent.criteria.type !== property.type) return false;
      if (intent.criteria.maxPrice && property.price > intent.criteria.maxPrice) return false;
      if (intent.criteria.minPrice && property.price < intent.criteria.minPrice) return false;
      return true;
    });

    if (filtered.length === 0) {
      console.log('[SearchMatchingService] No candidates found.');
      return [];
    }

    // Process top 5 — AI matching is temporarily disabled
    const results: MatchNotification[] = [];
    for (const intent of filtered.slice(0, 5)) {
      // TODO: Re-enable AI semantic matching when OpenAI is available in this context
      const match = false;
      const reason = 'AI matching temporarily disabled';

      if (match) {
        const notification: MatchNotification = {
          id: crypto.randomUUID(),
          userId: intent.userId,
          propertyId: property.id,
          propertyTitle: property.title,
          matchReason: reason,
          timestamp: Date.now(),
          read: false,
        };

        if (USE_SUPABASE) {
          try {
            await supabase.from('match_notifications').insert({
              id: notification.id,
              user_id: notification.userId,
              property_id: notification.propertyId,
              property_title: notification.propertyTitle,
              match_reason: notification.matchReason,
              timestamp: notification.timestamp,
              read: false,
            });
          } catch (e) {
            _notifications.push(notification);
          }
        } else {
          _notifications.push(notification);
        }

        results.push(notification);
      }
    }

    return results;
  },
};
