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
} from 'lucide-react-native';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import PropertyCard from '@/components/PropertyCard';
import { mockProperties } from '@/mocks/properties';
import { getColumns, getMaxContentWidth, useResponsive } from '@/constants/breakpoints';
import { useLanguage } from '@/providers/LanguageProvider';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { Property } from '@/types/property';

function getCarouselWidth(screenWidth: number): number {
  if (screenWidth >= 1440) return 500;
  if (screenWidth >= 1024) return 450;
  if (screenWidth >= 768) return 400;
  return screenWidth * 0.82;
}


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
  
  // Auto-scroll ref and state for recent listings
  const recentListRef = useRef<any>(null);
  const [recentIndex, setRecentIndex] = useState(0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning');
    if (hour < 18) return t('greeting_afternoon');
    return t('greeting_evening');
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
    const interval = setInterval(animateBell, 5000);
    return () => clearInterval(interval);
  }, [bellAnimation]);


  const carouselWidth = getCarouselWidth(dimensions.width);
  const maxContentWidth = getMaxContentWidth(dimensions.width);
  const columns = getColumns(dimensions.width);
  const contentPadding = isDesktop ? Math.max((dimensions.width - maxContentWidth) / 2, Spacing.xl) : Spacing.xl;

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
      name: submission.agent.name,
      phone: submission.agent.phone,
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
    allProperties.filter((p) => p.isFeatured || p.price > 100000000).slice(0, 5),
    [allProperties]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Search states for hero
  const [searchLocation, setSearchLocation] = useState<string>('');
  // Listing filter: 'all' | 'sale' | 'rent'
  const [listingFilter, setListingFilter] = useState<'all' | 'sale' | 'rent'>('all');

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
    { key: 'apartment', label: t('search_apartment') || 'Apartment', icon: '🏢' },
    { key: 'house', label: t('search_house') || 'House', icon: '🏡' },
    { key: 'villa', label: t('search_villa') || 'Villa', icon: '🏖️' },
    { key: 'land', label: t('search_land') || 'Land', icon: '🌿' },
    { key: 'commercial', label: t('search_commercial') || 'Commercial', icon: '🏬' },
  ];

  // Auto-slider for recent listings (every 1.5s)
  useEffect(() => {
    const slideTimer = setInterval(() => {
      if (recentListRef.current && allProperties.length > 0) {
        setRecentIndex((prevIndex) => {
          // Wrap around after 8 items or total length
          const maxItems = Math.min(allProperties.length, 8);
          const nextIndex = (prevIndex + 1) % maxItems;
          
          try {
            recentListRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
              viewPosition: 0,
            });
          } catch (e) {
            // Ignore scroll errors if list isn't fully laid out yet
          }
          return nextIndex;
        });
      }
    }, 1500);
    return () => clearInterval(slideTimer);
  }, [allProperties.length]);

  return (
    <View style={styles.container}>
      {/* === MOBILE HEADER (Native App Only) === */}
      {!isWeb && (
        <View style={[styles.mobileHeader, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerGreeting}>
              <Text style={styles.greeting}>{getGreeting()}, {userName} 👋</Text>
              <Text style={styles.greetingSubtitle}>{t('home_greeting_subtitle')}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Animated.View style={{
                transform: [{
                  rotate: bellAnimation.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] }),
                }],
              }}>
                <Bell size={20} color={colors.text} strokeWidth={2} />
              </Animated.View>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: !isWeb ? 90 : Spacing.xxxl }}
        testID="home-scroll"
      >
        {/* === HERO === */}
        <View style={[styles.hero, isDesktop && styles.heroDesktop]} testID="hero-section">
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
            <View style={styles.heroBadge}>
              <Sparkles size={11} color={colors.accentLight} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>{t('home_hero_badge')}</Text>
            </View>

            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
              {t('home_hero_title')}
            </Text>
            <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
              {t('home_hero_subtitle')}
            </Text>

            {/* Search bar */}
            <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
              <View style={[styles.searchBar, isDesktop && styles.searchBarDesktop]}>
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
              {isDesktop && (
                <>
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
                </>
              )}
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleHeroSearch}
                activeOpacity={0.85}
              >
                <Search size={18} color={colors.white} strokeWidth={2.5} />
                {isDesktop && <Text style={styles.searchButtonText}>{t('home_search_button')}</Text>}
              </TouchableOpacity>
            </View>

            {/* Stats row */}
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
          </View>
        </View>

        {/* === CATEGORY CHIPS === */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: contentPadding,
            gap: 10,
            paddingVertical: Spacing.lg,
            maxWidth: maxContentWidth,
            alignSelf: 'center',
            width: '100%',
          }}
        >
          {categories.map((cat, i) => (
            <TouchableOpacity
              key={i}
              style={styles.categoryChip}
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { type: cat.key } })}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryChipEmoji}>{cat.icon}</Text>
              <Text style={styles.categoryChipLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* === FEATURED CAROUSEL === */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }]}>
            <View>
              <View style={styles.sectionBadge}>
                <Sparkles size={11} color="#D97706" />
                <Text style={styles.sectionBadgeText}>{language === 'fr' ? 'SÉLECTION EXCLUSIVE' : 'EXCLUSIVE PICKS'}</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('home_featured_title')}</Text>
              <Text style={styles.sectionSubtitle}>{t('home_featured_subtitle')}</Text>
            </View>
            <TouchableOpacity
              // @ts-ignore
              className="immoci-see-all-btn"
              // @ts-ignore
              dataSet={{ class: 'immoci-see-all-btn' }}
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAll}>{t('home_see_all')}</Text>
              <ArrowRight size={13} color={colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <Animated.FlatList
            data={featuredProperties}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={carouselWidth + Spacing.lg}
            decelerationRate="fast"
            contentContainerStyle={[styles.carousel, { paddingLeft: contentPadding, paddingRight: contentPadding }]}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * (carouselWidth + Spacing.lg),
                index * (carouselWidth + Spacing.lg),
                (index + 1) * (carouselWidth + Spacing.lg),
              ];
              const scale = scrollX.interpolate({ inputRange, outputRange: [0.94, 1, 0.94], extrapolate: 'clamp' });
              return (
                <Animated.View style={[styles.carouselItem, { width: carouselWidth, transform: [{ scale }] }]}>
                  <TouchableOpacity
                    style={styles.featuredCard}
                    onPress={() => router.push(`/property/${item.id}`)}
                    activeOpacity={0.95}
                  >
                    <Image source={{ uri: item.images[0] }} style={styles.featuredImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(5,5,15,0.85)'] as any}
                      style={styles.featuredOverlay}
                    >
                      <View style={styles.featuredBadge}>
                        <Sparkles size={10} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.featuredBadgeText}>{t('home_featured_badge')}</Text>
                      </View>
                      <View style={styles.featuredInfo}>
                        <Text style={styles.featuredPrice}>
                          {(item.price / 1000000).toFixed(1)}M <Text style={styles.featuredCurrency}>FCFA</Text>
                        </Text>
                        <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.featuredLocation}>
                          <MapPin size={12} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
                          <Text style={styles.featuredLocationText}>{item.location.district}, {item.location.city}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
            keyExtractor={(item) => item.id}
          />
        </View>

        {/* === AI RECOMMENDATIONS === */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.aiIconContainer}>
                <Sparkles size={14} color="#fff" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{t('home_recommended_title') || 'Picked for You'}</Text>
                <Text style={styles.sectionSubtitle}>{t('home_recommended_subtitle') || 'AI-curated based on your preferences'}</Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: contentPadding, gap: 14 }}
            style={{ marginTop: 12 }}
          >
            {allProperties.slice(1, 5).map((property) => (
              <View key={property.id} style={{ width: 260 }}>
                <PropertyCard property={property} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* === RECENT LISTINGS === */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }]}>
            <View>
              <View style={[styles.sectionBadge, styles.sectionBadgeRecent]}>
                <Zap size={11} color="#059669" />
                <Text style={[styles.sectionBadgeText, styles.sectionBadgeTextRecent]}>{language === 'fr' ? 'DERNIÈRES OPPORTUNITÉS' : 'LATEST LISTINGS'}</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('home_recent_title')}</Text>
              <Text style={styles.sectionSubtitle}>{t('home_recent_subtitle')}</Text>
            </View>
            <TouchableOpacity
              // @ts-ignore
              className="immoci-see-all-btn"
              // @ts-ignore
              dataSet={{ class: 'immoci-see-all-btn' }}
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAll}>{t('home_see_all')}</Text>
              <ArrowRight size={13} color={colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Buy / Rent filter pills */}
          <View style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: contentPadding,
            marginTop: 12,
            marginBottom: 4,
          }}>
            {(['all', 'sale', 'rent'] as const).map((f) => {
              const label = f === 'all'
                ? (language === 'fr' ? 'Tout' : 'All')
                : f === 'sale'
                  ? (language === 'fr' ? 'Acheter' : 'Buy')
                  : (language === 'fr' ? 'Louer' : 'Rent');
              const isActive = listingFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setListingFilter(f)}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: isActive ? colors.primary : (colors.surface || '#F1F5F9'),
                    borderWidth: isActive ? 0 : 1,
                    borderColor: colors.border || '#E2E8F0',
                    shadowColor: isActive ? colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: isActive ? 4 : 0,
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: isActive ? '#FFFFFF' : (colors.textSecondary || '#64748B'),
                    letterSpacing: 0.1,
                  } as any}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ width: '100%', marginTop: 8 }}>
            <Animated.FlatList
              ref={recentListRef}
              data={(listingFilter === 'all'
                ? allProperties
                : allProperties.filter(p => p.status === listingFilter)
              ).slice(0, 8)}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={isDesktop ? 340 : 280}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: contentPadding, gap: 16 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{ width: isDesktop ? 324 : 264 }}>
                  <PropertyCard property={item} />
                </View>
              )}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  recentListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
            />
          </View>
        </View>

        {/* === FEATURES GRID (web only) === */}
        {isWeb && (
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
        )}

        {/* === MARKET TREND BANNER (mobile) === */}
        {!isWeb && (
          <TouchableOpacity
            style={[styles.trendBanner, { marginHorizontal: contentPadding }]}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight] as any}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.trendBannerIcon}>
              <TrendingUp size={22} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trendBannerTitle}>{language === 'fr' ? 'Le marché s\'enflamme 🔥' : 'Market is Heating Up 🔥'}</Text>
              <Text style={styles.trendBannerSubtitle}>{language === 'fr' ? '12% de nouvelles annonces cette semaine — explorez maintenant' : '12% more listings this week — browse now'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* === FOOTER (web) === */}
        {isWeb && (
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
              <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>{t('home_footer_follow')}</Text>
                <View style={styles.socialLinks}>
                  <TouchableOpacity
                    style={styles.socialIconBtn}
                    onPress={() => router.push('/help')}
                  >
                    <Text style={styles.socialIcon}>f</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.socialIconBtn}
                    onPress={() => router.push('/help')}
                  >
                    <Text style={styles.socialIcon}>in</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.socialIconBtn}
                    onPress={() => router.push('/help')}
                  >
                    <Text style={styles.socialIcon}>ig</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.footerBottom}>
              <View style={[styles.footerBottomContent, { maxWidth: maxContentWidth, paddingHorizontal: contentPadding }]}>
                <Text style={styles.footerCopyright}>{t('home_footer_copyright')}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // --- Web Navbar ---
  navbar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 14,
    zIndex: 100,
  },
  navbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  navbarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconWeb: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbarLogoText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  navbarLinks: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  navbarLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  navbarLinkText: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '500' as const,
  },
  navbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navbarLanguagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navbarLanguageText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  navbarAuthButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navbarAuthText: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600' as const,
  },
  navbarSignupButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: 9,
  },
  navbarSignupText: {
    ...Typography.body,
    color: colors.white,
    fontWeight: '600' as const,
  },

  // --- Mobile Header ---
  mobileHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400' as const,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.backgroundSecondary,
  },

  // --- Desktop Native Header ---
  desktopHeader: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: Spacing.lg,
  },
  desktopHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  desktopLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  desktopLogoTextWeb: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  desktopNav: {
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  desktopNavItemWeb: {
    paddingVertical: 6,
  },
  desktopNavTextWeb: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '500' as const,
  },
  desktopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  desktopLanguageWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  desktopLanguageTextWeb: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  desktopAuthButtonWeb: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  desktopAuthTextWeb: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600' as const,
  },
  desktopSignupButtonWeb: {
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    borderRadius: 9,
  },
  desktopSignupTextWeb: {
    ...Typography.body,
    color: colors.white,
    fontWeight: '600' as const,
  },

  // --- Hero ---
  hero: {
    minHeight: 380,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  heroDesktop: {
    minHeight: 520,
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
    fontWeight: '700' as const,
    color: colors.accentLight,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
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
    fontWeight: '400' as const,
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
    outlineStyle: 'none' as any,
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
    marginTop: 10,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.1,
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
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500' as const,
    marginTop: 1,
  },

  // --- Category chips ---
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },

  // --- Sections ---
  section: {
    marginBottom: Spacing.xxl,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
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
    marginBottom: 6,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
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
    fontSize: 21,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
    fontWeight: '400' as const,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        // @ts-ignore
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  seeAll: {
    fontSize: 12.5,
    color: colors.primary,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Carousel ---
  carousel: {},
  carouselItem: {
    marginRight: Spacing.lg,
  },
  featuredCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 300,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  featuredInfo: {
    gap: 4,
  },
  featuredPrice: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  featuredCurrency: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.75)',
  },
  featuredTitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  featuredLocationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as const,
  },

  // --- Property grid ---
  propertyList: {},
  propertyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  propertyGridTablet: {
    marginHorizontal: -Spacing.sm,
  },
  propertyGridDesktop: {
    marginHorizontal: -Spacing.md,
  },
  propertyGridItem: {
    paddingHorizontal: Spacing.sm,
  },

  // --- Trend banner ---
  trendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  trendBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 2,
  },
  trendBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400' as const,
  },

  // --- Features grid ---
  featuresSection: {
    paddingVertical: Spacing.xxl,
  },
  featuresSectionHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  featuresSectionTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
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
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    fontWeight: '400' as const,
  },

  // --- Footer ---
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
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -0.3,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  footerSection: {
    minWidth: 160,
    gap: 10,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '400' as const,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  socialIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 16,
  },
  footerBottomContent: {
    width: '100%',
    alignSelf: 'center',
  },
  footerCopyright: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '400' as const,
  },
});
