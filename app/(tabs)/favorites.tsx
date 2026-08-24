import React, { useMemo } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Search } from 'lucide-react-native';
import { router } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import PropertyCard from '@/components/PropertyCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { mockProperties } from '@/mocks/properties';
import type { Property } from '@/types/property';

import WebNavbar from '@/components/WebNavbar';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { favoriteIds } = useFavorites();
  const { getApprovedSubmissions } = usePropertySubmissions();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const favorites: Property[] = useMemo(() => {
    let approved: any[] = [];
    try {
      approved = getApprovedSubmissions();
    } catch {
      approved = [];
    }

    const submissionProperties: Property[] = approved.map((s) => ({
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

    const dbIds = new Set(submissionProperties.map((p) => p.id));
    const filteredMocks = mockProperties.filter((p) => !dbIds.has(p.id));
    const all = [...submissionProperties, ...filteredMocks];

    return all.filter((p) => favoriteIds.includes(p.id));
  }, [favoriteIds, getApprovedSubmissions]);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 0 : insets.top }]}>
      {Platform.OS === 'web' && <WebNavbar />}

      {/* Header */}
      <View
        // @ts-ignore
        className="heavenly-stagger-1"
        style={styles.header}
      >
        <View>
          <Text style={styles.title}>{t('favorites_title')}</Text>
          <Text style={styles.subtitle}>
            {favorites.length > 0
              ? `${favorites.length} ${t('favorites_properties')}`
              : t('favorites_empty_title')}
          </Text>
        </View>
        {favorites.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{favorites.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={favorites}
        renderItem={({ item, index }) => (
          <View
            // @ts-ignore
            className={`heavenly-stagger-${Math.min(index + 2, 5)}`}
            style={{ maxWidth: 800, width: '100%', alignSelf: 'center', marginBottom: 16 }}
          >
            <PropertyCard property={item} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <View
            // @ts-ignore
            className="heavenly-stagger-2"
            style={styles.emptyContainer}
          >
            <View style={styles.emptyIconBox}>
              <Heart size={40} color={colors.textLight} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>{t('favorites_empty_title')}</Text>
            <Text style={styles.emptyText}>{t('favorites_empty_text')}</Text>
            <TouchableOpacity
              // @ts-ignore
              className="heavenly-button"
              style={[styles.exploreButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.88}
            >
              <Search size={16} color="#fff" strokeWidth={2.5} />
              <Text style={styles.exploreButtonText}>Browse Properties</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400' as const,
  },
  countBadge: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xxl,
    gap: 12,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease',
      },
    }),
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
