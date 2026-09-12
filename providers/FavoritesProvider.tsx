import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockProperties } from '@/mocks/properties';
import type { Property } from '@/types/property';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/backend/supabase';

const LOCAL_FAVORITES_KEY = '@favorites_v2';

// ─────────────────────────────────────────────────────────────────────────────
// Supabase helpers — user_favorites table
// ─────────────────────────────────────────────────────────────────────────────

async function fetchFavoritesFromSupabase(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('property_id')
      .eq('user_id', userId);
    if (error) {
      console.warn('[Favorites] Supabase fetch error:', error.message);
      return [];
    }
    return (data ?? []).map((row: any) => row.property_id as string);
  } catch (e) {
    console.warn('[Favorites] Supabase fetch exception:', e);
    return [];
  }
}

async function addFavoriteToSupabase(userId: string, propertyId: string): Promise<void> {
  try {
    await supabase
      .from('user_favorites')
      .upsert({ user_id: userId, property_id: propertyId }, { onConflict: 'user_id,property_id' });
  } catch (e) {
    console.warn('[Favorites] Supabase add error:', e);
  }
}

async function removeFavoriteFromSupabase(userId: string, propertyId: string): Promise<void> {
  try {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);
  } catch (e) {
    console.warn('[Favorites] Supabase remove error:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastUserId = useRef<string | null>(null);

  // Load favorites — from Supabase (if logged in) or AsyncStorage (guest)
  const loadFavorites = useCallback(async (userId?: string) => {
    setIsLoading(true);
    try {
      if (userId) {
        // Authenticated: load from Supabase for cross-device persistence
        const ids = await fetchFavoritesFromSupabase(userId);
        setFavoriteIds(ids);
        // Also cache locally for offline resilience
        await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(ids)).catch(() => {});
      } else {
        // Guest: load from local AsyncStorage only
        const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setFavoriteIds(parsed);
        }
      }
    } catch (error) {
      console.warn('[Favorites] Load error:', error);
      setFavoriteIds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload when user auth state changes (login / logout)
  useEffect(() => {
    const userId = user?.id ?? undefined;
    if (userId !== lastUserId.current) {
      lastUserId.current = userId ?? null;
      loadFavorites(userId);
    }
  }, [user?.id, loadFavorites]);

  const toggleFavorite = useCallback(async (id: string) => {
    const userId = user?.id;

    // Optimistic UI update
    setFavoriteIds((prev) => {
      const isFav = prev.includes(id);
      const newFavs = isFav ? prev.filter((fid) => fid !== id) : [...prev, id];

      // Persist asynchronously without blocking UI
      if (userId) {
        if (isFav) {
          removeFavoriteFromSupabase(userId, id).catch(console.warn);
        } else {
          addFavoriteToSupabase(userId, id).catch(console.warn);
        }
      }
      // Always update local cache too
      AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(newFavs)).catch(console.warn);

      return newFavs;
    });
  }, [user?.id]);

  const isFavorite = useCallback((id: string) => {
    return favoriteIds.includes(id);
  }, [favoriteIds]);

  const favorites = useMemo((): Property[] => {
    return mockProperties.filter((p) => favoriteIds.includes(p.id));
  }, [favoriteIds]);

  return {
    favoriteIds,
    favorites,
    isFavorite,
    toggleFavorite,
    isLoading,
  };
});
