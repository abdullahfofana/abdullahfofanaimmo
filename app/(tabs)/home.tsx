import { router } from 'expo-router';
import {
  Home as HomeIcon,
  MapPin,
  Search,
  DollarSign,
  Globe,
  Sparkles,
  ChevronDown,
  Users,
  Shield,
  Zap,
  Bell,
  TrendingUp,
  ArrowRight,
  SlidersHorizontal,
  Phone,
  MessageCircle,
  Map as MapIcon,
  Heart,
  Bed,
  Bath,
  Maximize2,
  CheckCircle2,
  Building2,
  X,
} from 'lucide-react-native';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import PropertyMap from '@/components/PropertyMap';
import Typography from '@/constants/typography';
import PropertyCard from '@/components/PropertyCard';
import FadeInView from '@/components/FadeInView';
import { mockProperties } from '@/mocks/properties';
import { getColumns, getMaxContentWidth, useResponsive } from '@/constants/breakpoints';
import { useLanguage } from '@/providers/LanguageProvider';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { Property } from '@/types/property';
import AreaPriceStatsCard from '@/components/AreaPriceStatsCard';
import { calculateAreaPriceStats } from '@/utils/priceStats';

function getCarouselWidth(screenWidth: number): number {
  if (screenWidth >= 1440) return 500;
  if (screenWidth >= 1024) return 450;
  if (screenWidth >= 768) return 400;
  return screenWidth * 0.84;
}

const POPULAR_AREAS = [
  {
    id: 'cocody',
    name: 'Cocody',
    city: 'Abidjan',
    slug: 'cocody',
    citySlug: 'abidjan',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    tag: 'Ambassades & Résidentiel',
  },
  {
    id: 'riviera',
    name: 'Riviera 3',
    city: 'Abidjan',
    slug: 'riviera',
    citySlug: 'abidjan',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    tag: 'Lycée Français & Golf',
  },
  {
    id: 'deux_plateaux',
    name: '2 Plateaux',
    city: 'Abidjan',
    slug: 'deux-plateaux',
    citySlug: 'abidjan',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    tag: 'Vallons & 7ème Tranche',
  },
  {
    id: 'plateau',
    name: 'Plateau',
    city: 'Abidjan',
    slug: 'plateau',
    citySlug: 'abidjan',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    tag: 'Centre des Affaires',
  },
  {
    id: 'marcory',
    name: 'Marcory / Zone 4',
    city: 'Abidjan',
    slug: 'marcory',
    citySlug: 'abidjan',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    tag: 'Zone 4C & Biétry',
  },
  {
    id: 'yopougon',
    name: 'Yopougon',
    city: 'Abidjan',
    slug: 'yopougon',
    citySlug: 'abidjan',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    tag: 'Maroc & Niangon',
  },
  {
    id: 'bingerville',
    name: 'Bingerville',
    city: 'Abidjan',
    slug: 'bingerville',
    citySlug: 'abidjan',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    tag: 'Lagune & Calme',
  },
  {
    id: 'grand_bassam',
    name: 'Grand-Bassam',
    city: 'Grand-Bassam',
    slug: 'grand-bassam',
    citySlug: 'grand-bassam',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    tag: 'Bord de Mer & Historique',
  },
  {
    id: 'yamoussoukro',
    name: 'Yamoussoukro',
    city: 'Yamoussoukro',
    slug: 'yamoussoukro',
    citySlug: 'yamoussoukro',
    image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800',
    tag: 'Capitale & Basilique',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const bellAnimation = useRef(new Animated.Value(0)).current;
  const { isTablet, isDesktop } = useResponsive();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [propertyType, setPropertyType] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [userName] = useState('Jean');
  const colors = useColors();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Mobile Location Modal State
  const [selectedLocation, setSelectedLocation] = useState<string>('Abidjan, Côte d\'Ivoire');
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  // Selected category filter on mobile
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Listing filter: 'all' | 'sale' | 'rent'
  const [listingFilter, setListingFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [hoveredListingFilter, setHoveredListingFilter] = useState<string | null>(null);

  // 3D Carousel state for desktop recent listings
  const [recentIndex, setRecentIndex] = useState(0);
  const carouselAnim = useRef(new Animated.Value(0)).current;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning') || (language === 'fr' ? 'Bonjour' : 'Good Morning');
    if (hour < 18) return t('greeting_afternoon') || (language === 'fr' ? 'Bon après-midi' : 'Good Afternoon');
    return t('greeting_evening') || (language === 'fr' ? 'Bonsoir' : 'Good Evening');
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const animateBell = () => {
      Animated.sequence([
        Animated.timing(bellAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellAnimation, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(bellAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    };
    const interval = setInterval(animateBell, 6000);
    return () => clearInterval(interval);
  }, [bellAnimation]);

  const carouselWidth = getCarouselWidth(dimensions.width);
  const maxContentWidth = getMaxContentWidth(dimensions.width);
  const columns = getColumns(dimensions.width);
  const contentPadding = isDesktop ? Math.max((dimensions.width - maxContentWidth) / 2, Spacing.xl) : Spacing.md;

  const isWeb = Platform.OS === 'web';
  const { t, toggleLanguage, language } = useLanguage();
  const { getApprovedSubmissions } = usePropertySubmissions();

  const approvedSubmissions = React.useMemo(() => {
    try {
      return getApprovedSubmissions();
    } catch (error) {
      return [];
    }
  }, [getApprovedSubmissions]);

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
      coordinates: { latitude: 5.359952, longitude: -4.008256 },
    },
    images: submission.photos,
    features: submission.features,
    agent: {
      id: 'agent-' + submission.id,
      name: submission.agent?.name || 'Agent ImmoCI',
      phone: submission.agent?.phone || '+225 07 48 22 19 00',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
    },
    isFeatured: false,
    createdAt: submission.submittedAt,
  });

  const realProperties = React.useMemo(() => {
    try { return approvedSubmissions.map(mapSubmissionToProperty); }
    catch { return []; }
  }, [approvedSubmissions]);

  const allProperties = React.useMemo(() => [...realProperties, ...mockProperties], [realProperties]);
  const featuredProperties = React.useMemo(() =>
    allProperties.filter((p) => p.isFeatured || p.price > 100000000).slice(0, 6),
    [allProperties]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Search states for hero
  const [searchLocation, setSearchLocation] = useState<string>('');

  const handleHeroSearch = () => {
    let typeParam: string | undefined = undefined;
    if (propertyType.trim()) {
      const lower = propertyType.toLowerCase();
      if (lower.includes('villa')) typeParam = 'villa';
      else if (lower.includes('appart') || lower.includes('apart')) typeParam = 'apartment';
      else if (lower.includes('maison') || lower.includes('house')) typeParam = 'house';
      else if (lower.includes('terrain') || lower.includes('land')) typeParam = 'land';
      else if (lower.includes('comm')) typeParam = 'commercial';
    }

    router.push({
      pathname: '/(tabs)/search',
      params: {
        q: searchLocation.trim() || undefined,
        type: typeParam,
      },
    });
  };

  // Category filter chips data
  const categories = [
    { key: 'all', label: language === 'fr' ? 'Tous les biens' : 'All Properties', icon: '✨' },
    { key: 'apartment', label: t('search_apartment') || 'Appartements', icon: '🏢' },
    { key: 'villa', label: t('search_villa') || 'Villas', icon: '🏖️' },
    { key: 'house', label: t('search_house') || 'Maisons', icon: '🏡' },
    { key: 'land', label: t('search_land') || 'Terrains', icon: '🌿' },
    { key: 'commercial', label: t('search_commercial') || 'Bureaux & Pro', icon: '🏬' },
  ];

  // Filtered properties based on current status and category
  const filteredFeedProperties = useMemo(() => {
    return allProperties.filter(p => {
      const matchesStatus = listingFilter === 'all' || p.status === listingFilter;
      const matchesCategory = selectedCategory === 'all' || p.type === selectedCategory;
      return matchesStatus && matchesCategory;
    });
  }, [allProperties, listingFilter, selectedCategory]);

  const recentItems = useMemo(() =>
    (listingFilter === 'all'
      ? allProperties
      : allProperties.filter(p => p.status === listingFilter)
    ).slice(0, 8),
    [allProperties, listingFilter]
  );

  const goToSlide = useCallback((nextIndex: number) => {
    Animated.timing(carouselAnim, {
      toValue: nextIndex,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setRecentIndex(nextIndex);
  }, [carouselAnim]);

  // Auto-advance desktop 3D carousel
  useEffect(() => {
    if (!isWeb || recentItems.length === 0) return;
    const timer = setInterval(() => {
      setRecentIndex(prev => {
        const next = (prev + 1) % recentItems.length;
        Animated.timing(carouselAnim, {
          toValue: next,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isWeb, recentItems.length, carouselAnim]);

  const handleWhatsAppContact = (phone: string, title: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const text = encodeURIComponent(
      language === 'fr'
        ? `Bonjour, je vous contacte concernant l'annonce : ${title} sur ImmoCI.`
        : `Hello, I'm contacting you regarding the listing: ${title} on ImmoCI.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`);
  };

  const handleCallContact = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  return (
    <View style={styles.container}>
      {/* ═════════════════════════════════════════════════════════════════
          NATIVE MOBILE HOME HEADER & AIRBNB-STYLE SEARCH CAPSULE
      ═════════════════════════════════════════════════════════════════ */}
      {!isDesktop && (
        <View style={[styles.mobileNativeHeader, { paddingTop: insets.top + 8 }]}>
          {/* Top Bar: Location & Actions */}
          <View style={styles.mobileTopBar}>
            <TouchableOpacity
              style={styles.mobileLocationPill}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}
            >
              <MapPin size={15} color="#059669" />
              <View>
                <Text style={styles.mobileLocationSub}>{language === 'fr' ? 'Explorer la zone' : 'Explore Area'}</Text>
                <Text style={styles.mobileLocationTitle} numberOfLines={1}>{selectedLocation}</Text>
              </View>
              <ChevronDown size={14} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.mobileHeaderActions}>
              <TouchableOpacity
                style={styles.mobileNotificationBtn}
                onPress={() => router.push('/(tabs)/search')}
                activeOpacity={0.8}
              >
                <Animated.View style={{
                  transform: [{
                    rotate: bellAnimation.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] }),
                  }],
                }}>
                  <Bell size={19} color="#0F172A" strokeWidth={2} />
                </Animated.View>
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Floating Search Capsule (Airbnb / Google Stitch Mobile Style) */}
          <TouchableOpacity
            style={styles.mobileSearchCapsule}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.9}
          >
            <View style={styles.searchCapsuleIconBox}>
              <Search size={18} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={styles.searchCapsuleTextWrap}>
              <Text style={styles.searchCapsuleTitle}>
                {language === 'fr' ? 'Où souhaitez-vous habiter ?' : 'Where would you like to live?'}
              </Text>
              <Text style={styles.searchCapsuleSub}>
                {language === 'fr' ? 'Cocody · Riviera · Plateau · Tous prix' : 'Cocody · Riviera · Plateau · Any price'}
              </Text>
            </View>
            <View style={styles.searchCapsuleFilterBtn}>
              <SlidersHorizontal size={15} color="#059669" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MAIN SCROLL CONTENT
      ═════════════════════════════════════════════════════════════════ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: !isDesktop ? 120 : Spacing.xxxl }}
        testID="home-scroll"
      >
        {/* ─── DESKTOP-ONLY HERO BANNER ─────────────────────────────────── */}
        {isDesktop && (
          <View style={[styles.hero, styles.heroDesktop]} testID="hero-section">
            <Image
              source={require('@/assets/images/ivory_coast_real_estate_bg.jpg')}
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(10,10,20,0.38)', 'rgba(10,10,20,0.72)'] as any}
              style={StyleSheet.absoluteFill}
            />

            <View style={[styles.heroContent, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }]}>
              {/* Badge */}
              <FadeInView delay={50}>
                <View style={styles.heroBadge}>
                  <Building2 size={12} color="#059669" strokeWidth={2.4} />
                  <Text style={styles.heroBadgeText}>
                    {language === 'fr' ? "N°1 DE L'IMMOBILIER EN CÔTE D'IVOIRE" : '#1 REAL ESTATE PLATFORM IN IVORY COAST'}
                  </Text>
                </View>
              </FadeInView>

              <FadeInView delay={120}>
                <Text style={[styles.heroTitle, styles.heroTitleDesktop]}>
                  {t('home_hero_title')}
                </Text>
              </FadeInView>

              <FadeInView delay={180}>
                <Text style={[styles.heroSubtitle, styles.heroSubtitleDesktop]}>
                  {t('home_hero_subtitle')}
                </Text>
              </FadeInView>

              {/* Desktop Multi-Field Search bar */}
              <FadeInView delay={250}>
                <View style={[styles.searchContainer, styles.searchContainerDesktop]}>
                  <View style={[styles.searchBar, styles.searchBarDesktop]}>
                    <MapPin size={18} color={colors.primary} strokeWidth={2.5} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={t('home_search_placeholder')}
                      placeholderTextColor={colors.textLight}
                      value={searchLocation}
                      onChangeText={setSearchLocation}
                      onSubmitEditing={handleHeroSearch}
                    />
                  </View>
                  <View style={styles.searchDivider} />
                  <View style={styles.searchBar}>
                    <HomeIcon size={18} color={colors.textSecondary} strokeWidth={2.5} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={t('home_property_type')}
                      placeholderTextColor={colors.textLight}
                      value={propertyType}
                      onChangeText={setPropertyType}
                      onSubmitEditing={handleHeroSearch}
                    />
                  </View>
                  <View style={styles.searchDivider} />
                  <View style={styles.searchBar}>
                    <DollarSign size={18} color={colors.textSecondary} strokeWidth={2.5} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={t('home_price_range')}
                      placeholderTextColor={colors.textLight}
                      value={priceRange}
                      onChangeText={setPriceRange}
                      onSubmitEditing={handleHeroSearch}
                    />
                  </View>
                  <TouchableOpacity
                    // @ts-ignore
                    className="heavenly-button"
                    style={styles.searchButton}
                    onPress={handleHeroSearch}
                    activeOpacity={0.85}
                  >
                    <Search size={18} color={colors.white} strokeWidth={2.5} />
                    <Text style={styles.searchButtonText}>{t('home_search_button')}</Text>
                  </TouchableOpacity>
                </View>
              </FadeInView>

              {/* Stats row */}
              <FadeInView delay={320}>
                <View style={styles.heroStats}>
                  {[
                    { value: '2,400+', label: t('home_stat_properties') || 'Properties' },
                    { value: '120+', label: t('home_stat_agents') || 'Agents' },
                    { value: '98%', label: t('home_stat_satisfaction') || 'Satisfaction' },
                  ].map((stat, i) => (
                    <View key={i} style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{stat.value}</Text>
                      <Text style={styles.heroStatLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>
            </View>
          </View>
        )}

        {/* ─── CATEGORY STORY CHIPS BAR (Mobile & Web) ──────────────── */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.categoriesScrollContent,
              { paddingHorizontal: contentPadding, maxWidth: maxContentWidth },
            ]}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryStoryChip,
                    isSelected && styles.categoryStoryChipActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.key);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                  {isSelected && <View style={styles.categoryActiveDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── QUARTIERS POPULAIRES (POPULAR AREAS CAROUSEL) ─────────── */}
        <View style={[styles.section, { marginTop: 16 }]}>
          <View style={[styles.sectionHeader, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }]}>
            <View>
              <View style={[styles.sectionBadge, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                <MapPin size={11} color="#059669" />
                <Text style={[styles.sectionBadgeText, { color: '#059669' }]}>
                  {language === 'fr' ? 'ZONES TRÈS RECHERCHÉES' : 'POPULAR LOCATIONS'}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>
                {language === 'fr' ? 'Quartiers Populaires' : 'Popular Areas'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {language === 'fr' ? 'Découvrez les zones les plus demandées d\'Abidjan' : 'Explore the most sought-after neighborhoods'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/search')}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAll}>{t('home_see_all') || 'Voir tout'}</Text>
              <ArrowRight size={13} color={colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingHorizontal: contentPadding, paddingVertical: 4 }}
          >
            {POPULAR_AREAS.map((area) => {
              const stats = calculateAreaPriceStats(allProperties, area.name, area.city);
              return (
                <TouchableOpacity
                  key={area.id}
                  style={styles.popularAreaCard}
                  onPress={() => router.push(`/area/${area.citySlug}/${area.slug}` as any)}
                  activeOpacity={0.92}
                >
                  <Image source={{ uri: area.image }} style={styles.popularAreaImage} resizeMode="cover" />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.15)', 'rgba(15, 23, 42, 0.88)']}
                    style={styles.popularAreaOverlay}
                  >
                    <View style={styles.popularAreaTopTag}>
                      <Text style={styles.popularAreaTopTagText}>{area.tag}</Text>
                    </View>

                    <View style={styles.popularAreaInfo}>
                      <Text style={styles.popularAreaName}>{area.name}</Text>
                      <Text style={styles.popularAreaCity}>{area.city}</Text>

                      <View style={styles.popularAreaBottomRow}>
                        <View style={styles.popularAreaCountBadge}>
                          <Building2 size={11} color="#059669" />
                          <Text style={styles.popularAreaCountText}>
                            {stats.totalCount} {language === 'fr' ? 'biens' : 'listings'}
                          </Text>
                        </View>
                        {stats.avgSalePrice ? (
                          <Text style={styles.popularAreaAvgPrice}>
                            ~{(stats.avgSalePrice / 1000000).toFixed(0)}M FCFA
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── FEATURED / EXCLUSIVE PICKS CAROUSEL ─────────────────── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }]}>
            <View>
              <View style={[styles.sectionBadge, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
                <Building2 size={11} color="#059669" />
                <Text style={[styles.sectionBadgeText, { color: '#059669' }]}>
                  {language === 'fr' ? 'SÉLECTION PREMIUM' : 'PREMIUM SELECTION'}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>{t('home_featured_title') || 'Biens en vedette'}</Text>
              <Text style={styles.sectionSubtitle}>{t('home_featured_subtitle') || 'Sélection de biens vérifiés par nos experts'}</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAll}>{t('home_see_all') || 'Voir tout'}</Text>
              <ArrowRight size={13} color={colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <Animated.FlatList
            data={featuredProperties}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={carouselWidth + Spacing.md}
            decelerationRate="fast"
            contentContainerStyle={[styles.carousel, { paddingLeft: contentPadding, paddingRight: contentPadding }]}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            renderItem={({ item, index }) => {
              const isFav = isFavorite(item.id);
              return (
                <View style={[styles.featuredCardWrapper, { width: carouselWidth }]}>
                  <TouchableOpacity
                    style={styles.featuredCard}
                    onPress={() => router.push(`/property/${item.id}`)}
                    activeOpacity={0.95}
                  >
                    <Image source={{ uri: item.images[0] }} style={styles.featuredImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.15)', 'rgba(5,5,15,0.88)'] as any}
                      style={styles.featuredOverlay}
                    >
                      <View style={styles.featuredCardTopRow}>
                        <View style={styles.featuredBadge}>
                          <Text style={styles.featuredBadgeText}>
                            {item.status === 'sale' ? (language === 'fr' ? 'VENTE' : 'FOR SALE') : (language === 'fr' ? 'LOCATION' : 'FOR RENT')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.featuredFavBtn, isFav && styles.featuredFavBtnActive]}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                        >
                          <Heart size={16} color={isFav ? '#EF4444' : '#FFFFFF'} fill={isFav ? '#EF4444' : 'transparent'} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.featuredInfo}>
                        <Text style={styles.featuredPrice}>
                          {(item.price / 1000000).toFixed(1)}M <Text style={styles.featuredCurrency}>FCFA</Text>
                          {item.status === 'rent' && <Text style={styles.featuredRentPerMonth}> /mois</Text>}
                        </Text>
                        <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.featuredLocation}>
                          <MapPin size={12} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
                          <Text style={styles.featuredLocationText}>{item.location.district}, {item.location.city}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            }}
            keyExtractor={(item) => item.id}
          />
        </View>

        {/* ─── EXPLORE PROPERTIES (Responsive Multi-Column Grid on Web & Luxury Cards on Mobile) ─── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }]}>
            <View>
              <View style={[styles.sectionBadge, styles.sectionBadgeRecent]}>
                <Building2 size={11} color="#059669" />
                <Text style={[styles.sectionBadgeText, styles.sectionBadgeTextRecent]}>
                  {language === 'fr' ? 'ANNONCES RÉCENTES' : 'RECENT LISTINGS'}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>
                {language === 'fr' ? 'Toutes les Annonces' : 'All Available Properties'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {filteredFeedProperties.length} {language === 'fr' ? 'biens disponibles à Abidjan & environs' : 'verified listings available'}
              </Text>
            </View>

            {/* Quick Status Filter Switcher */}
            <View style={styles.statusFilterPillRow}>
              {(['all', 'sale', 'rent'] as const).map((f) => {
                const label = f === 'all'
                  ? (language === 'fr' ? 'Tout' : 'All')
                  : f === 'sale'
                    ? (language === 'fr' ? '🏷️ À Vendre' : '🏷️ Buy')
                    : (language === 'fr' ? '🔑 À Louer' : '🔑 Rent');
                const isActive = listingFilter === f;
                const isHovered = hoveredListingFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setListingFilter(f)}
                    activeOpacity={0.8}
                    // @ts-ignore
                    onMouseEnter={() => setHoveredListingFilter(f)}
                    // @ts-ignore
                    onMouseLeave={() => setHoveredListingFilter(null)}
                    style={[
                      styles.statusFilterPill,
                      isActive && styles.statusFilterPillActive,
                      !isActive && isHovered && styles.statusFilterPillHovered,
                    ]}
                  >
                    <Text style={[
                      styles.statusFilterPillText,
                      isActive && styles.statusFilterPillTextActive,
                      !isActive && isHovered && styles.statusFilterPillTextHovered,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Desktop/Tablet Multi-Column Grid OR Mobile Touch Cards */}
          <View style={{ maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }}>
            {filteredFeedProperties.length === 0 ? (
              <View style={styles.emptyFeedState}>
                <HomeIcon size={36} color="#94A3B8" />
                <Text style={styles.emptyFeedTitle}>
                  {language === 'fr' ? 'Aucune annonce trouvée' : 'No properties found'}
                </Text>
                <Text style={styles.emptyFeedSub}>
                  {language === 'fr' ? 'Essayez de modifier la catégorie ou le type d\'offre.' : 'Try changing your category or filter selection.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyFeedResetBtn}
                  onPress={() => {
                    setSelectedCategory('all');
                    setListingFilter('all');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyFeedResetBtnText}>
                    {language === 'fr' ? 'Afficher tous les biens' : 'Show all listings'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : columns > 1 || isDesktop || isTablet ? (
              /* Desktop / Tablet: Responsive 2, 3 or 4 Column Grid */
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
                {filteredFeedProperties.map((property) => (
                  <View
                    key={property.id}
                    style={{
                      width: `${100 / columns}%` as any,
                      paddingHorizontal: 8,
                      marginBottom: 20,
                    }}
                  >
                    <PropertyCard property={property} />
                  </View>
                ))}
              </View>
            ) : (
              /* Mobile Native: Luxury Clean Cards Feed */
              <View style={styles.mobileFeedList}>
                {filteredFeedProperties.map((property) => {
                  const isFav = isFavorite(property.id);
                  return (
                    <TouchableOpacity
                      key={property.id}
                      style={styles.mobileCleanCard}
                      onPress={() => router.push(`/property/${property.id}`)}
                      activeOpacity={0.92}
                    >
                      {/* Image Frame with Badges */}
                      <View style={styles.mobileCleanImageWrap}>
                        <Image
                          source={{ uri: property.images[0] }}
                          style={styles.mobileCleanImage}
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
                          locations={[0, 0.4, 1]}
                          style={StyleSheet.absoluteFill}
                        />

                        {/* Top Status & Verified Badges */}
                        <View style={styles.mobileCleanTopBadges}>
                          <View style={[
                            styles.mobileCleanStatusPill,
                            property.status === 'rent' && styles.mobileCleanStatusPillRent,
                          ]}>
                            <Text style={styles.mobileCleanStatusText}>
                              {property.status === 'sale'
                                ? (language === 'fr' ? 'À VENDRE' : 'FOR SALE')
                                : (language === 'fr' ? 'À LOUER' : 'FOR RENT')}
                            </Text>
                          </View>

                          <View style={styles.mobileCleanAcdPill}>
                            <CheckCircle2 size={11} color="#059669" />
                            <Text style={styles.mobileCleanAcdText}>ACD</Text>
                          </View>
                        </View>

                        {/* Top Right Heart Favorite Button */}
                        <TouchableOpacity
                          style={[styles.mobileCleanHeartBtn, isFav && styles.mobileCleanHeartBtnActive]}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite(property.id);
                          }}
                          activeOpacity={0.8}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <Heart
                            size={17}
                            color={isFav ? '#EF4444' : '#FFFFFF'}
                            fill={isFav ? '#EF4444' : 'transparent'}
                            strokeWidth={2.4}
                          />
                        </TouchableOpacity>

                        {/* Bottom Left Photo Count Badge */}
                        <View style={styles.mobileCleanPhotoCountBadge}>
                          <Text style={styles.mobileCleanPhotoCountText}>
                            📷 {property.images?.length || 1} photos
                          </Text>
                        </View>
                      </View>

                      {/* Card Body */}
                      <View style={styles.mobileCleanBody}>
                        {/* Price Row */}
                        <View style={styles.mobileCleanPriceRow}>
                          <Text style={styles.mobileCleanPrice}>
                            {(property.price / 1000000).toFixed(1)}M <Text style={styles.mobileCleanCurrency}>FCFA</Text>
                            {property.status === 'rent' && (
                              <Text style={styles.mobileCleanUnit}> /mois</Text>
                            )}
                          </Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.mobileCleanTitle} numberOfLines={1}>
                          {property.title}
                        </Text>

                        {/* Location */}
                        <View style={styles.mobileCleanLocationRow}>
                          <MapPin size={13} color="#64748B" />
                          <Text style={styles.mobileCleanLocationText}>
                            {property.location.district}, {property.location.city}
                          </Text>
                        </View>

                        {/* Specs Divider & Chips */}
                        <View style={styles.mobileCleanSpecsRow}>
                          {!!property.bedrooms && (
                            <View style={styles.mobileCleanSpecChip}>
                              <Bed size={13} color="#059669" />
                              <Text style={styles.mobileCleanSpecText}>{property.bedrooms} ch</Text>
                            </View>
                          )}
                          {!!property.bathrooms && (
                            <View style={styles.mobileCleanSpecChip}>
                              <Bath size={13} color="#059669" />
                              <Text style={styles.mobileCleanSpecText}>{property.bathrooms} sdb</Text>
                            </View>
                          )}
                          <View style={styles.mobileCleanSpecChip}>
                            <Maximize2 size={13} color="#059669" />
                            <Text style={styles.mobileCleanSpecText}>{property.area} m²</Text>
                          </View>
                        </View>

                        {/* Quick 1-Tap Contact Action Bar */}
                        <View style={styles.mobileCleanActionRow}>
                          <TouchableOpacity
                            style={styles.mobileCleanWhatsAppBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleWhatsAppContact(property.agent.phone, property.title);
                            }}
                            activeOpacity={0.8}
                          >
                            <MessageCircle size={15} color="#059669" strokeWidth={2.4} />
                            <Text style={styles.mobileCleanWhatsAppBtnText}>WhatsApp</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.mobileCleanCallBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleCallContact(property.agent.phone);
                            }}
                            activeOpacity={0.8}
                          >
                            <Phone size={15} color="#475569" strokeWidth={2.4} />
                            <Text style={styles.mobileCleanCallBtnText}>
                              {language === 'fr' ? 'Appeler' : 'Call'}
                            </Text>
                          </TouchableOpacity>

                          <View style={styles.mobileCleanDetailPill}>
                            <Text style={styles.mobileCleanDetailPillText}>
                              {language === 'fr' ? 'Détails' : 'Details'}
                            </Text>
                            <ArrowRight size={13} color="#059669" strokeWidth={2.4} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ─── AVERAGE PROPERTY PRICE BY AREA (DYNAMIC MARKET ENGINE) ─── */}
        <View style={[styles.section, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding, marginTop: 32 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'fr' ? "Prix Moyen de l'Immobilier par Commune" : 'Average Property Price by Area'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {language === 'fr' ? 'Estimations en temps réel calculées sur la base de nos annonces' : 'Live real estate market price statistics across Côte d\'Ivoire'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                {language === 'fr' ? 'Voir la carte' : 'View on map'}
              </Text>
              <ArrowRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingVertical: 8 }}
          >
            {[
              { area: 'Cocody', city: 'Abidjan' },
              { area: 'Deux Plateaux', city: 'Abidjan' },
              { area: 'Riviera', city: 'Abidjan' },
              { area: 'Plateau', city: 'Abidjan' },
              { area: 'Marcory', city: 'Abidjan' },
              { area: 'Yopougon', city: 'Abidjan' },
              { area: 'Bingerville', city: 'Abidjan' },
              { area: 'Grand-Bassam', city: 'Grand-Bassam' },
              { area: 'Bouaké', city: 'Bouaké' },
              { area: 'Yamoussoukro', city: 'Yamoussoukro' },
            ].map(({ area, city }) => {
              const stats = calculateAreaPriceStats(allProperties, area, city);
              return (
                <View key={area} style={{ width: isDesktop ? 320 : 280 }}>
                  <AreaPriceStatsCard
                    stats={stats}
                    compact={true}
                    onExplorePress={() => router.push(`/area/${city.toLowerCase().replace(/\s+/g, '-')}/${area.toLowerCase().replace(/\s+/g, '-')}` as any)}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── EXPLORE ON MAP (MOBILE INTERACTIVE DISCOVERY BANNER) ─── */}
        {!isDesktop && (
          <View style={[styles.section, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding, marginTop: 24 }]}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={[styles.sectionBadge, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                  <MapPin size={11} color="#059669" />
                  <Text style={[styles.sectionBadgeText, { color: '#059669' }]}>
                    {language === 'fr' ? 'CARTE INTERACTIVE' : 'INTERACTIVE MAP'}
                  </Text>
                </View>
                <Text style={styles.sectionTitle}>
                  {language === 'fr' ? 'Explorer les biens sur la carte' : 'Explore Properties on Map'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {language === 'fr' ? 'Repérez les logements par quartier avec les prix et services à proximité' : 'Find listings by neighborhood with prices and nearby services'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.mobileMapBannerCard}
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { view: 'map' } })}
              activeOpacity={0.92}
            >
              <View style={styles.mobileMapBannerInner}>
                <PropertyMap properties={allProperties.slice(0, 8)} />
              </View>
              <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.88)']}
                style={styles.mobileMapBannerOverlay}
              >
                <View style={styles.mobileMapBannerContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mobileMapBannerTitle}>
                      {allProperties.length}+ {language === 'fr' ? 'Biens géolocalisés' : 'Properties located'}
                    </Text>
                    <Text style={styles.mobileMapBannerSub}>
                      {language === 'fr' ? 'Cocody · Riviera · 2 Plateaux · Plateau' : 'All districts in Abidjan & interior'}
                    </Text>
                  </View>
                  <View style={styles.mobileMapBannerBtn}>
                    <Text style={styles.mobileMapBannerBtnText}>
                      {language === 'fr' ? 'Ouvrir' : 'Open'}
                    </Text>
                    <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── DESKTOP-ONLY FEATURES & FOOTER ──────────────────────────── */}
        {isDesktop && (
          <>
            <View style={[styles.featuresSection, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }]} testID="features-grid">
              <View style={styles.featuresSectionHeader}>
                <Text style={styles.featuresSectionTitle}>{language === 'fr' ? 'Pourquoi choisir ImmoCI ?' : 'Why Choose ImmoCI?'}</Text>
                <Text style={styles.featuresSectionSubtitle}>{language === 'fr' ? 'La plateforme immobilière la plus fiable en Côte d\'Ivoire' : 'The most trusted real estate platform in Ivory Coast'}</Text>
              </View>
              <View style={styles.featuresGrid}>
                {[
                  { icon: <Search size={22} color={colors.primary} />, title: t('features_search_title'), desc: t('features_search_desc') },
                  { icon: <HomeIcon size={22} color={colors.primary} />, title: t('features_buy_title'), desc: t('features_buy_desc') },
                  { icon: <MapPin size={22} color={colors.primary} />, title: t('features_location_title'), desc: t('features_location_desc') },
                  { icon: <Users size={22} color={colors.primary} />, title: t('features_community_title'), desc: t('features_community_desc') },
                  { icon: <Shield size={22} color={colors.primary} />, title: t('features_security_title'), desc: t('features_security_desc') },
                  { icon: <Zap size={22} color={colors.primary} />, title: t('features_quick_title'), desc: t('features_quick_desc') },
                ].map((f, i) => (
                  <View key={i} style={styles.featureCard}>
                    <View style={styles.featureIconBox}>{f.icon}</View>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.footer} testID="web-footer">
              <View style={[styles.footerContent, { maxWidth: maxContentWidth, paddingHorizontal: contentPadding }]}>
                <View style={styles.footerBrand}>
                  <View style={styles.footerLogo}>
                    <HomeIcon size={18} color="#fff" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.footerBrandName}>ImmoCI</Text>
                  <Text style={styles.footerText}>{t('home_footer_description')}</Text>
                </View>
                <View style={styles.footerSection}>
                  <Text style={styles.footerTitle}>{t('home_footer_quick_links')}</Text>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(tabs)/search', params: { status: 'sale' } })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>{t('nav_buy')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(tabs)/search', params: { status: 'rent' } })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>{t('nav_rent')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/admin')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>{t('home_footer_admin')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.footerSection}>
                  <Text style={styles.footerTitle}>{t('home_footer_support')}</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/help')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>{t('home_footer_contact') || 'Contact Us'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/help')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>{t('home_footer_help') || 'Help Center'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── LOCATION SELECTOR BOTTOM SHEET (MOBILE) ─────────────── */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity
          style={styles.locationModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
          <View
            style={[styles.locationModalContent, { paddingBottom: insets.bottom + 20 }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.locationModalDragIndicator} />
            <View style={styles.locationModalHeader}>
              <View>
                <Text style={styles.locationModalTitle}>
                  {language === 'fr' ? 'Choisir une zone' : 'Select a location'}
                </Text>
                <Text style={styles.locationModalSubtitle}>
                  {language === 'fr' ? 'Abidjan & Villes de l\'Intérieur' : 'Abidjan & Interior cities'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.locationModalCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {[
                { name: '🇨🇮 Tout Abidjan', query: '', sub: 'Toutes les communes' },
                { name: 'Cocody', query: 'Cocody', sub: 'Ambassades, Riviera, Deux Plateaux' },
                { name: 'Deux Plateaux', query: 'Deux Plateaux', sub: 'Vallons, 7ème & 8ème Tranche' },
                { name: 'Riviera 3', query: 'Riviera', sub: 'Golf, Palmeraie, Riviera 4' },
                { name: 'Plateau', query: 'Plateau', sub: 'Centre des Affaires & Sièges' },
                { name: 'Marcory / Zone 4', query: 'Marcory', sub: 'Zone 4C, Biétry, Résidentiel' },
                { name: 'Yopougon', query: 'Yopougon', sub: 'Maroc, Niangon, Toit Rouge' },
                { name: 'Bingerville', query: 'Bingerville', sub: 'Lagune, Résidences calmes' },
                { name: 'Grand-Bassam', query: 'Grand-Bassam', sub: 'Bord de mer & Ville historique' },
                { name: 'Bouaké', query: 'Bouaké', sub: 'Centre, Commerce, Kennedy' },
                { name: 'Yamoussoukro', query: 'Yamoussoukro', sub: 'Capitale administrative' },
              ].map((loc) => {
                const isSelected = selectedLocation.includes(loc.query) && loc.query.length > 0;
                return (
                  <TouchableOpacity
                    key={loc.name}
                    style={[styles.locationOptionRow, isSelected && styles.locationOptionRowSelected]}
                    onPress={() => {
                      setSelectedLocation(loc.name === '🇨🇮 Tout Abidjan' ? 'Abidjan, Côte d\'Ivoire' : `${loc.name}, Côte d'Ivoire`);
                      setShowLocationModal(false);
                      if (loc.query) {
                        router.push({ pathname: '/(tabs)/search', params: { q: loc.query } });
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.locationOptionIconBox, isSelected && styles.locationOptionIconBoxSelected]}>
                      <MapPin size={16} color={isSelected ? '#FFFFFF' : '#059669'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.locationOptionName, isSelected && styles.locationOptionNameSelected]}>
                        {loc.name}
                      </Text>
                      <Text style={styles.locationOptionSub}>{loc.sub}</Text>
                    </View>
                    <ChevronDown size={14} color="#94A3B8" style={{ transform: [{ rotate: '-90deg' }] }} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Mobile Native Header ─────────────────────────────────────
  mobileNativeHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 20,
  },
  mobileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mobileLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileLocationSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mobileLocationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  mobileHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileNotificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // ── Floating Search Capsule (Airbnb / Stitch style) ─────────
  mobileSearchCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 7,
    paddingLeft: 8,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  searchCapsuleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCapsuleTextWrap: {
    flex: 1,
    paddingHorizontal: 10,
  },
  searchCapsuleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchCapsuleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  searchCapsuleFilterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Categories Bar ───────────────────────────────────────────
  categoriesWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  categoriesScrollContent: {
    gap: 8,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  categoryStoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  categoryStoryChipActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#059669',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    ...Platform.select({
      web: {
        transition: 'color 0.2s ease',
      },
    }),
  },
  categoryLabelActive: {
    color: '#059669',
    fontWeight: '800',
  },
  categoryActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#059669',
  },

  // ── Sections ─────────────────────────────────────────────────
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.8,
  },
  sectionBadgeRecent: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  sectionBadgeTextRecent: {
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // Status Filter Pill Row
  statusFilterPillRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 10,
  },
  statusFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  statusFilterPillActive: {
    backgroundColor: '#059669',
  },
  statusFilterPillHovered: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },
  statusFilterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    ...Platform.select({
      web: {
        transition: 'color 0.2s ease',
      },
    }),
  },
  statusFilterPillTextHovered: {
    color: '#059669',
  },
  statusFilterPillTextActive: {
    color: '#FFFFFF',
  },

  // ── Featured Horizontal Carousel ─────────────────────────────
  carousel: {},
  featuredCardWrapper: {
    marginRight: 14,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 240,
    position: 'relative',
    backgroundColor: '#0F172A',
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 14,
  },
  featuredCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  featuredFavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredFavBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  featuredInfo: {
    gap: 3,
  },
  featuredPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featuredCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FBBF24',
  },
  featuredRentPerMonth: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  featuredTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredLocationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Clean Luxury Mobile Cards Feed ────────────────────────────
  mobileFeedList: {
    gap: 20,
    paddingTop: 8,
  },
  mobileCleanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  mobileCleanImageWrap: {
    width: '100%',
    height: 210,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  mobileCleanImage: {
    width: '100%',
    height: '100%',
  },
  mobileCleanTopBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  mobileCleanStatusPill: {
    backgroundColor: 'rgba(5, 150, 105, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backdropFilter: 'blur(8px)',
  },
  mobileCleanStatusPillRent: {
    backgroundColor: 'rgba(13, 148, 136, 0.92)',
  },
  mobileCleanStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  mobileCleanAcdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mobileCleanAcdText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  mobileCleanHeartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mobileCleanHeartBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  mobileCleanPhotoCountBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mobileCleanPhotoCountText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mobileCleanBody: {
    padding: 16,
  },
  mobileCleanPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mobileCleanPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  mobileCleanCurrency: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  mobileCleanUnit: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  mobileCleanTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 20,
  },
  mobileCleanLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  mobileCleanLocationText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  mobileCleanSpecsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  mobileCleanSpecChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mobileCleanSpecText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  mobileCleanActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  mobileCleanWhatsAppBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    paddingVertical: 9,
    borderRadius: 12,
  },
  mobileCleanWhatsAppBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#059669',
  },
  mobileCleanCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 12,
  },
  mobileCleanCallBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  mobileCleanDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  mobileCleanDetailPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // ── Empty State ──────────────────────────────────────────────
  emptyFeedState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyFeedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyFeedSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyFeedResetBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyFeedResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Floating Map Button ──────────────────────────────────────
  floatingMapPill: {
    position: 'absolute',
    bottom: 95,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 99,
  },
  floatingMapPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  // ── Desktop Web-Only Styles ──────────────────────────────────
  hero: {
    minHeight: 380,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  heroDesktop: {
    minHeight: 500,
  },
  heroContent: {
    gap: 16,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.xxl,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201,147,58,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(201,147,58,0.40)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentLight,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  heroTitleDesktop: {
    fontSize: 52,
    lineHeight: 60,
    maxWidth: 800,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 22,
    fontWeight: '400',
  },
  heroSubtitleDesktop: {
    fontSize: 17,
    maxWidth: 600,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  searchContainerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 900,
    padding: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    flex: 1,
  },
  searchBarDesktop: {
    paddingVertical: 0,
  },
  searchDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: Spacing.md,
  },
  searchButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  heroStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: 8,
  },
  heroStat: {
    alignItems: 'flex-start',
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginTop: 1,
  },
  featuresSection: {
    paddingVertical: Spacing.xxl,
  },
  featuresSectionHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  featuresSectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  featuresSectionSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  featureCard: {
    flexGrow: 1,
    minWidth: 240,
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    backgroundColor: colors.surfaceGreen,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    fontWeight: '400',
  },
  footer: {
    backgroundColor: colors.primary,
    paddingTop: Spacing.xxl,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  footerBrand: {
    minWidth: 200,
    maxWidth: 280,
    gap: 10,
  },
  footerLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  footerBrandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
    fontWeight: '400',
  },
  footerSection: {
    minWidth: 160,
    gap: 10,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '400',
  },

  // ── POPULAR AREAS STYLES ────────────────────────────────────
  popularAreaCard: {
    width: 220,
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  popularAreaImage: {
    width: '100%',
    height: '100%',
  },
  popularAreaOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
    justifyContent: 'space-between',
  },
  popularAreaTopTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  popularAreaTopTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  popularAreaInfo: {
    gap: 2,
  },
  popularAreaName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  popularAreaCity: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginBottom: 4,
  },
  popularAreaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  popularAreaCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  popularAreaCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  popularAreaAvgPrice: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#34D399',
  },

  // ── MOBILE MAP DISCOVERY BANNER ──────────────────────────────
  mobileMapBannerCard: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  mobileMapBannerInner: {
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as any,
  },
  mobileMapBannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  mobileMapBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileMapBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mobileMapBannerSub: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  mobileMapBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  mobileMapBannerBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── LOCATION SELECTOR BOTTOM SHEET ──────────────────────────
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  locationModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  locationModalDragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  locationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  locationModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  locationModalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 3,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  locationOptionRowSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: '#059669',
  },
  locationOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationOptionIconBoxSelected: {
    backgroundColor: '#059669',
  },
  locationOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationOptionNameSelected: {
    color: '#059669',
  },
  locationOptionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
});
