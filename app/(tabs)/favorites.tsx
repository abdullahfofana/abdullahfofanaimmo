import React, { useMemo } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Search } from 'lucide-react-native';
import { router } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { IconSizes, IconStrokes } from '@/constants/icons';
import Button from '@/components/ui/Button';
import PropertyCard from '@/components/PropertyCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { mockProperties } from '@/mocks/properties';
import type { Property } from '@/types/property';
import { useResponsive } from '@/constants/breakpoints';

import FadeInView from '@/components/FadeInView';
import WebFooter from '@/components/WebFooter';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { t, language } = useLanguage();
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
    <View style={[styles.container, { paddingTop: isDesktop ? 0 : insets.top }]}>
      {/* Header */}
      <FadeInView delay={60}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('favorites_title') || 'Mes Favoris'}</Text>
            <Text style={styles.subtitle}>
              {favorites.length > 0
                ? `${favorites.length} ${t('favorites_properties') || 'biens sauvegardés'}`
                : (language === 'fr' ? 'Aucun favori enregistré' : 'No favorites saved')}
            </Text>
          </View>
          {favorites.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{favorites.length}</Text>
            </View>
          )}
        </View>
      </FadeInView>

      <FlatList
        data={favorites}
        renderItem={({ item, index }) => (
          <FadeInView
            delay={Math.min(index * 70 + 100, 500)}
            style={{ maxWidth: 800, width: '100%', alignSelf: 'center', marginBottom: 16 }}
          >
            <PropertyCard property={item} />
          </FadeInView>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={true}
        ListFooterComponent={isDesktop ? <WebFooter /> : null}
        ListEmptyComponent={
          <FadeInView delay={120}>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Heart size={40} color="#EF4444" strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {language === 'fr' ? 'Votre liste de favoris est vide' : 'Your favorites list is empty'}
              </Text>
              <Text style={styles.emptyText}>
                {language === 'fr'
                  ? 'Appuyez sur le cœur d’une annonce pour l’ajouter à vos favoris et la retrouver facilement.'
                  : 'Tap the heart icon on any property to save it here for quick access.'}
              </Text>
              <Button
                variant="primary"
                size="md"
                label={language === 'fr' ? 'Explorer les biens' : 'Explore Properties'}
                leftIcon={<Search size={IconSizes.action} color="#FFFFFF" strokeWidth={IconStrokes.medium} />}
                onPress={() => router.push('/(tabs)/search')}
                style={{ marginTop: 8 }}
              />
            </View>
          </FadeInView>
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEAE4',
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  countBadge: {
    backgroundColor: '#059669',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800' as const,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 120,
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#111827',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400' as const,
    maxWidth: 320,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#059669',
    marginTop: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800' as const,
  },
});

