import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockProperties } from '@/mocks/properties';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import type { Property } from '@/types/property';

const FAVORITES_KEY = '@favorites_v1';

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getApprovedSubmissions } = usePropertySubmissions();

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
    // Combine mock properties with real approved DB submissions
    const approvedSubmissions = (() => {
      try {
        return getApprovedSubmissions();
      } catch {
        return [];
      }
    })();

    // Map approved submissions to Property format (same mapping as property/[id].tsx)
    const submissionProperties: Property[] = approvedSubmissions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      price: s.price,
      currency: 'FCFA',
      type: s.type,
      status: s.status,
      bedrooms: s.bedrooms,
      bathrooms: s.bathrooms,
      area: s.area,
      location: {
        address: s.location.address,
        city: s.location.city,
        district: s.location.district,
        coordinates: s.location.coordinates ?? { latitude: 5.3485, longitude: -4.0125 },
      },
      images: s.photos,
      features: s.features,
      agent: {
        id: `agent-${s.id}`,
        name: s.agent.name,
        phone: s.agent.phone,
      },
      isFeatured: false,
      createdAt: s.submittedAt,
    }));

    // Merge: DB properties take precedence over mock ones with same ID
    const dbIds = new Set(submissionProperties.map((p) => p.id));
    const filteredMocks = mockProperties.filter((p) => !dbIds.has(p.id));
    const allProperties: Property[] = [...submissionProperties, ...filteredMocks];

    return allProperties.filter((p) => favoriteIds.includes(p.id));
  }, [favoriteIds, getApprovedSubmissions]);

  return {
    favoriteIds,
    favorites,
    isFavorite,
    toggleFavorite,
    isLoading
  };
});

