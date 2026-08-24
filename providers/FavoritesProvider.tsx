import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockProperties } from '@/mocks/properties';
import type { Property } from '@/types/property';

const FAVORITES_KEY = '@favorites_v1';

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed);
        }
      }
    } catch (error) {
      console.log('Favorites loading error (using empty array):', error);
      setFavoriteIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (id: string) => {
    setFavoriteIds((prev) => {
      const isFav = prev.includes(id);
      let newFavs;
      if (isFav) {
        newFavs = prev.filter((favId) => favId !== id);
      } else {
        newFavs = [...prev, id];
      }
      
      // Persist asynchronously
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs)).catch(console.error);
      return newFavs;
    });
  }, []);

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
    isLoading
  };
});

