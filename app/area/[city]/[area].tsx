import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  MapPin,
  ArrowLeft,
  Search,
  Filter,
  Building,
  Home,
  CheckCircle2,
  TrendingUp,
  Share2,
  SlidersHorizontal,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { mockProperties } from '@/mocks/properties';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { Property, PropertyType } from '@/types/property';
import { getAreaBySlug, ALL_AREAS, getCityBySlug } from '@/constants/geoHierarchy';
import { calculateAreaPriceStats } from '@/utils/priceStats';
import AreaPriceStatsCard from '@/components/AreaPriceStatsCard';
import PropertyMap from '@/components/PropertyMap';
import NearbyServicesSection from '@/components/NearbyServicesSection';
import PropertyCard from '@/components/PropertyCard';
import WebNavbar from '@/components/WebNavbar';
import { useResponsive } from '@/constants/breakpoints';
import { useLanguage } from '@/providers/LanguageProvider';

export default function AreaLandingPage() {
  const params = useLocalSearchParams<{ city: string; area: string }>();
  const citySlug = params.city || 'abidjan';
  const areaSlug = params.area || 'cocody';
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const { isDesktop } = useResponsive();

  const [selectedType, setSelectedType] = useState<PropertyType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'sale' | 'rent'>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest');

  const { getApprovedSubmissions } = usePropertySubmissions();
  const approvedSubmissions = getApprovedSubmissions();

  const mapSubmissionToProperty = (submission: any): Property => ({
    id: submission.id,
    title: submission.title,
    description: submission.description,
    price: submission.price,
    currency: 'FCFA',
    type: submission.type,
    status: submission.status,
    bedrooms: submission.bedrooms,
    bathrooms: submission.bathrooms,
    area: submission.area,
    location: {
      ...submission.location,
      coordinates: submission.location.coordinates || { latitude: 5.359952, longitude: -4.008256 },
    },
    images: submission.photos || [],
    features: submission.features || [],
    agent: {
      id: 'agent-' + submission.id,
      name: submission.agent?.name || 'Agent',
      phone: submission.agent?.phone || '',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256',
    },
    isFeatured: false,
    createdAt: submission.submittedAt,
  });

  const allProperties: Property[] = useMemo(() => {
    return [...approvedSubmissions.map(mapSubmissionToProperty), ...mockProperties];
  }, [approvedSubmissions]);

  // Lookup area info from hierarchy
  const areaInfo = useMemo(() => {
    return (
      getAreaBySlug(citySlug, areaSlug) || {
        id: areaSlug,
        slug: areaSlug,
        name: areaSlug.charAt(0).toUpperCase() + areaSlug.slice(1),
        nameFr: areaSlug.charAt(0).toUpperCase() + areaSlug.slice(1),
        cityId: citySlug,
        cityName: citySlug.charAt(0).toUpperCase() + citySlug.slice(1),
        latitude: 5.3599,
        longitude: -4.0083,
        zoom: 14,
        descriptionFr: `Découvrez toutes les annonces immobilières vérifiées et les opportunités d'achat ou de location à ${areaSlug}.`,
        descriptionEn: `Explore verified real estate listings and investment opportunities in ${areaSlug}.`,
        popularTypes: ['villa', 'apartment', 'house'] as PropertyType[],
        bannerImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
      }
    );
  }, [citySlug, areaSlug]);

  // Dynamic Market Price Statistics for this area
  const areaStats = useMemo(() => {
    return calculateAreaPriceStats(allProperties, areaInfo.name, areaInfo.cityName);
  }, [allProperties, areaInfo]);

  // Filter listings for this specific area
  const areaProperties = useMemo(() => {
    const areaLower = areaInfo.name.toLowerCase();
    const cityLower = areaInfo.cityName.toLowerCase();

    return allProperties.filter((p) => {
      const pDist = (p.location?.district || '').toLowerCase();
      const pCity = (p.location?.city || '').toLowerCase();
      const pTitle = (p.title || '').toLowerCase();
      const pAddr = (p.location?.address || '').toLowerCase();

      const matches =
        pDist.includes(areaLower) ||
        areaLower.includes(pDist) ||
        pAddr.includes(areaLower) ||
        pTitle.includes(areaLower);

      return matches;
    });
  }, [allProperties, areaInfo]);

  // Apply sub-filters & sort
  const filteredAndSortedProperties = useMemo(() => {
    let list = [...areaProperties];

    if (selectedType !== 'all') {
      list = list.filter((p) => p.type === selectedType);
    }
    if (selectedStatus !== 'all') {
      list = list.filter((p) => p.status === selectedStatus);
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [areaProperties, selectedType, selectedStatus, sortBy]);

  const pageTitle = isFr
    ? `Immobilier à ${areaInfo.name}, ${areaInfo.cityName}`
    : `Real Estate in ${areaInfo.name}, ${areaInfo.cityName}`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {Platform.OS === 'web' && <WebNavbar />}

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Banner */}
          <View style={styles.heroWrap}>
            <Image source={{ uri: areaInfo.bannerImage }} style={styles.heroImage} />
            <LinearGradient
              colors={['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.88)']}
              style={styles.heroOverlay}
            >
              <View style={styles.heroTopActions}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <ArrowLeft size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.countryTag}>
                  <Text style={styles.countryTagText}>🇨🇮 Côte d&apos;Ivoire · {areaInfo.cityName}</Text>
                </View>
              </View>

              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text style={styles.heroBadgeText}>
                    {isFr ? 'QUARTIER VÉRIFIÉ' : 'VERIFIED DISTRICT'}
                  </Text>
                </View>
                <Text style={styles.heroTitle}>{pageTitle}</Text>
                <Text style={styles.heroDescription}>
                  {isFr ? areaInfo.descriptionFr : areaInfo.descriptionEn}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Main Body */}
          <View style={[styles.bodyContainer, isDesktop && styles.bodyDesktop]}>
            {/* Dynamic Market Stats Card */}
            <AreaPriceStatsCard stats={areaStats} showExploreButton={false} />

            {/* Sub-Districts Chips if available */}
            {areaInfo.subDistricts && areaInfo.subDistricts.length > 0 && (
              <View style={styles.subDistrictsCard}>
                <Text style={styles.subDistrictsTitle}>
                  {isFr ? 'Secteurs & Sous-Quartiers :' : 'Sectors & Neighborhoods:'}
                </Text>
                <View style={styles.subDistrictsList}>
                  {areaInfo.subDistricts.map((sub) => (
                    <View key={sub} style={styles.subDistrictChip}>
                      <MapPin size={11} color="#059669" />
                      <Text style={styles.subDistrictText}>{sub}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Filter & Sort Controls */}
            <View style={styles.filterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {/* Status Toggle */}
                {(['all', 'sale', 'rent'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text style={[styles.filterChipText, selectedStatus === status && styles.filterChipTextActive]}>
                      {status === 'all' ? (isFr ? 'Tout' : 'All') : status === 'sale' ? (isFr ? 'À Vendre' : 'For Sale') : (isFr ? 'À Louer' : 'For Rent')}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Type Filter */}
                {(['all', 'villa', 'apartment', 'house', 'land'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>
                      {type === 'all' ? (isFr ? 'Tous types' : 'All types') : type === 'villa' ? 'Villas' : type === 'apartment' ? 'Appartements' : type === 'house' ? 'Maisons' : 'Terrains'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Properties Listings Grid */}
            <View style={styles.listingsSection}>
              <View style={styles.listingsHeader}>
                <Text style={styles.listingsCountText}>
                  {filteredAndSortedProperties.length} {isFr ? 'bien(s) disponible(s)' : 'properties available'}
                </Text>
                <View style={styles.sortSelector}>
                  <TouchableOpacity
                    style={[styles.sortBtn, sortBy === 'newest' && styles.sortBtnActive]}
                    onPress={() => setSortBy('newest')}
                  >
                    <Text style={[styles.sortBtnText, sortBy === 'newest' && styles.sortBtnTextActive]}>
                      {isFr ? 'Récents' : 'Newest'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sortBtn, sortBy === 'price_asc' && styles.sortBtnActive]}
                    onPress={() => setSortBy('price_asc')}
                  >
                    <Text style={[styles.sortBtnText, sortBy === 'price_asc' && styles.sortBtnTextActive]}>
                      {isFr ? 'Prix croissant' : 'Price: Low-High'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sortBtn, sortBy === 'price_desc' && styles.sortBtnActive]}
                    onPress={() => setSortBy('price_desc')}
                  >
                    <Text style={[styles.sortBtnText, sortBy === 'price_desc' && styles.sortBtnTextActive]}>
                      {isFr ? 'Prix décroissant' : 'Price: High-Low'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {filteredAndSortedProperties.length === 0 ? (
                <View style={styles.emptyListingsBox}>
                  <Text style={styles.emptyListingsTitle}>
                    {isFr ? `Aucun bien correspondant aux filtres à ${areaInfo.name}` : `No matching properties in ${areaInfo.name}`}
                  </Text>
                  <Text style={styles.emptyListingsDesc}>
                    {isFr
                      ? 'Essayez de réinitialiser vos filtres ou de publier la première annonce dans cette zone.'
                      : 'Try resetting your filters or list the first property in this area.'}
                  </Text>
                  <TouchableOpacity
                    style={styles.addPropertyCTA}
                    onPress={() => router.push('/(tabs)/add-property')}
                  >
                    <Text style={styles.addPropertyCTAText}>
                      {isFr ? '⚡ Publier une annonce dans ce quartier' : '⚡ List a property in this area'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.propertiesGrid}>
                  {filteredAndSortedProperties.map((property) => (
                    <View key={property.id} style={isDesktop ? styles.propertyGridItemDesktop : styles.propertyGridItemMobile}>
                      <PropertyCard property={property} />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Interactive Area Map */}
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>
                🗺️ {isFr ? `Carte Immobilière de ${areaInfo.name}` : `Real Estate Map of ${areaInfo.name}`}
              </Text>
              <View style={styles.mapBox}>
                <PropertyMap
                  properties={filteredAndSortedProperties.length > 0 ? filteredAndSortedProperties : allProperties}
                  showFilterBar={false}
                  showNearbyPOIs={true}
                  centerCoordinates={{
                    latitude: areaInfo.latitude,
                    longitude: areaInfo.longitude,
                    zoom: areaInfo.zoom,
                  }}
                />
              </View>
            </View>

            {/* Nearby Infrastructure & Services in this area */}
            <NearbyServicesSection
              latitude={areaInfo.latitude}
              longitude={areaInfo.longitude}
              maxDistanceKm={6}
            />
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  heroWrap: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'space-between',
  },
  heroTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countryTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroContent: {
    gap: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    maxWidth: 650,
  },

  // Body
  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  bodyDesktop: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },

  // Sub-Districts
  subDistrictsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  subDistrictsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  subDistrictsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subDistrictChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subDistrictText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },

  // Filter Bar
  filterBar: {
    marginVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Listings Section
  listingsSection: {
    marginVertical: 12,
  },
  listingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  listingsCountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sortSelector: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 8,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  sortBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // Properties Grid
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  propertyGridItemMobile: {
    width: '100%',
  },
  propertyGridItemDesktop: {
    width: 'calc(33.333% - 11px)' as any,
    minWidth: 280,
  },

  // Empty state
  emptyListingsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyListingsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyListingsDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  addPropertyCTA: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  addPropertyCTAText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Map Section
  mapSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  mapBox: {
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
