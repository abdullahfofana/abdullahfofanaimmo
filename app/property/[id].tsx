import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Phone,
  Mail,
  X,
  ChevronRight,
  MessageCircle,
  MessageSquare,
} from 'lucide-react-native';
import { Modal } from 'react-native';
import PropertyMap from '@/components/PropertyMap';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { IconSizes, IconStrokes } from '@/constants/icons';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Badge from '@/components/ui/Badge';
import { mockProperties } from '@/mocks/properties';
import { getMaxContentWidth, useResponsive } from '@/constants/breakpoints';
import { useLanguage } from '@/providers/LanguageProvider';
import { openInGoogleMaps, openInWaze } from '@/utils/map';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { useChat } from '@/providers/ChatProvider';
import { Property } from '@/types/property';
import WebNavbar from '@/components/WebNavbar';
import { formatPriceFull, formatPriceCompact } from '@/utils/currency';
import WebFooter from '@/components/WebFooter';
import NearbyServicesSection from '@/components/NearbyServicesSection';
import BuyerDistanceWidget from '@/components/BuyerDistanceWidget';
import AreaPriceStatsCard from '@/components/AreaPriceStatsCard';
import { calculateAreaPriceStats } from '@/utils/priceStats';
import { useFavorites } from '@/providers/FavoritesProvider';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { isFavorite: isFavoriteCheck, toggleFavorite } = useFavorites();
  const { startOrGetConversation } = useChat();
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const { isDesktop } = useResponsive();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'gallery' | 'features' | 'location'>('overview');
  const { isLoading, getApprovedSubmissions } = usePropertySubmissions();
  const [isMapVisible, setIsMapVisible] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const maxContentWidth = getMaxContentWidth(dimensions.width);
  const imageWidth = isDesktop ? Math.min(dimensions.width, maxContentWidth) : dimensions.width;

  const approvedSubmissions = useMemo(() => {
    try {
      return getApprovedSubmissions();
    } catch (error) {
      console.error('[PropertyDetail] Failed to get approved submissions:', error);
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
      coordinates: submission.location.coordinates || { latitude: 5.359952, longitude: -4.008256 },
    },
    images: submission.photos || [],
    features: submission.features || [],
    agent: {
      id: 'agent-' + submission.id,
      name: submission.agent?.name || 'Agent',
      phone: submission.agent?.phone || '',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    },
    isFeatured: false,
    createdAt: submission.submittedAt,
  });

  const realProperties = useMemo(() => {
    return approvedSubmissions.map(mapSubmissionToProperty);
  }, [approvedSubmissions]);

  const allProperties = useMemo(() => {
    return [...realProperties, ...mockProperties];
  }, [realProperties]);

  const property = allProperties.find((p) => p.id === id);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('loading') || 'Loading...'}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.notFoundText}>{t('property_not_found') || 'Property not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>{t('go_back') || 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLocationPress = () => {
    setIsMapVisible(true);
  };

  const formatPrice = (price: number, currency: string = 'FCFA') => {
    return formatPriceFull(price, currency);
  };

  const handleShare = async () => {
    if (!property) return;
    try {
      const shareUrl = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.href
        : `https://immoci.ci/property/${property.id}`;
      const message = `${property.title}\n💰 ${formatPrice(property.price, property.currency)}\n📍 ${property.location.district}, ${property.location.city}\n\n${shareUrl}`;

      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: property.title,
          text: message,
          url: shareUrl,
        });
      } else {
        await Share.share({
          title: property.title,
          message: message,
          url: shareUrl,
        });
      }
    } catch (error: any) {
      if (error?.message && !error.message.includes('dismissed') && !error.message.includes('AbortError')) {
        console.warn('[PropertyDetail] Share error:', error);
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {isDesktop && <WebNavbar />}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <View style={[styles.imageContainer, isDesktop && { alignItems: 'center' }]}>
            <View style={{ width: imageWidth }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / imageWidth
                  );
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {property.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={[styles.image, { width: imageWidth }]}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              <View
                style={[
                  styles.headerActions,
                  { paddingTop: insets.top + Spacing.sm },
                ]}
                pointerEvents="box-none"
              >
                <IconButton
                  variant="translucentLight"
                  size="md"
                  icon={<ArrowLeft size={IconSizes.action} color={Colors.text} strokeWidth={IconStrokes.medium} />}
                  onPress={handleBack}
                  accessibilityLabel="Retour"
                />
                <View style={styles.headerRight}>
                  <IconButton
                    variant="translucentLight"
                    size="md"
                    icon={<Share2 size={IconSizes.action} color={Colors.text} strokeWidth={IconStrokes.medium} />}
                    onPress={handleShare}
                    accessibilityLabel="Partager l'annonce"
                  />
                  <IconButton
                    variant="translucentLight"
                    size="md"
                    icon={
                      <Heart
                        size={IconSizes.action}
                        color={property && isFavoriteCheck(property.id) ? Colors.error : Colors.text}
                        fill={property && isFavoriteCheck(property.id) ? Colors.error : 'transparent'}
                        strokeWidth={IconStrokes.medium}
                      />
                    }
                    onPress={() => property && toggleFavorite(property.id)}
                    accessibilityLabel="Ajouter aux favoris"
                  />
                </View>
              </View>

              {/* ── BOTTOM THUMBNAIL PREVIEW OVERLAY (REFERENCE IMAGE STYLE) ── */}
              <View style={styles.thumbnailStripOverlay}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
                  {property.images.slice(0, 5).map((img, i) => {
                    const isCurrent = i === currentImageIndex;
                    const isLastPreview = i === 4 && property.images.length > 5;
                    const remainingCount = property.images.length - 4;

                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.thumbnailPill, isCurrent && styles.thumbnailPillActive]}
                        onPress={() => setCurrentImageIndex(i)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: img }} style={styles.thumbnailImg} resizeMode="cover" />
                        {isLastPreview && (
                          <View style={styles.thumbnailMoreOverlay}>
                            <Text style={styles.thumbnailMoreText}>+{remainingCount}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* ── OVERLAPPING DETAIL SHEET (REFERENCE DESIGN) ───────────── */}
          <View style={[
            styles.content,
            isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }
          ]}>
            <View style={[styles.mainContent, isDesktop && styles.mainContentDesktop]}>
              <View style={[styles.leftColumn, isDesktop && styles.leftColumnDesktop]}>
                
                {/* Category Crown & Star Rating Header Row */}
                <View style={styles.categoryRatingRow}>
                  <View style={styles.categoryCrownBadge}>
                    <Text style={styles.categoryCrownIcon}>👑</Text>
                    <Text style={styles.categoryCrownText}>
                      {property.type === 'villa'
                        ? (language === 'fr' ? 'Villa de Prestige' : 'Luxury Villa')
                        : property.type === 'apartment'
                        ? (language === 'fr' ? 'Appartement Haut Standing' : 'Luxury Apartment')
                        : (language === 'fr' ? 'Résidence de Prestige' : 'Luxury Residence')}
                    </Text>
                  </View>

                  <View style={styles.detailRatingBadge}>
                    <Text style={styles.detailRatingStar}>★</Text>
                    <Text style={styles.detailRatingScore}>4.8</Text>
                    <Text style={styles.detailRatingCount}>({language === 'fr' ? '18 avis' : '18 Reviews'})</Text>
                  </View>
                </View>

                {/* Big Bold Property Title */}
                <Text style={styles.title}>{property.title}</Text>

                {/* Location Line */}
                <TouchableOpacity
                  style={styles.locationRowWrap}
                  onPress={handleLocationPress}
                  activeOpacity={0.75}
                >
                  <MapPin size={15} color="#059669" strokeWidth={2.4} />
                  <Text style={styles.locationSubtitleText} numberOfLines={1}>
                    {property.location.address ? `${property.location.address}, ` : ''}{property.location.district}, {property.location.city}
                  </Text>
                  <ChevronRight size={14} color="#64748B" />
                </TouchableOpacity>

                {/* Segmented Navigation Tabs (Overview | Gallery | Features | Location) */}
                <View style={styles.segmentedTabsRow}>
                  {[
                    { id: 'overview', label: language === 'fr' ? 'Aperçu' : 'Overview' },
                    { id: 'gallery', label: language === 'fr' ? 'Photos' : 'Gallery' },
                    { id: 'features', label: language === 'fr' ? 'Commodités' : 'Features' },
                    { id: 'location', label: language === 'fr' ? 'Localisation' : 'Location' },
                  ].map((tab) => {
                    const isActive = activeDetailTab === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        style={[styles.segmentedTabBtn, isActive && styles.segmentedTabBtnActive]}
                        onPress={() => setActiveDetailTab(tab.id as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.segmentedTabText, isActive && styles.segmentedTabTextActive]}>
                          {tab.label}
                        </Text>
                        {isActive && <View style={styles.segmentedTabActiveUnderline} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Key Specs Row (Soft Squircle Capsule Cards) */}
                <View style={styles.specs}>
                  {property.bedrooms ? (
                    <View style={styles.spec}>
                      <Bed size={18} color="#059669" strokeWidth={2.2} />
                      <Text style={styles.specText}>{property.bedrooms} {language === 'fr' ? 'Chambres' : 'Beds'}</Text>
                    </View>
                  ) : null}
                  {property.bathrooms ? (
                    <View style={styles.spec}>
                      <Bath size={18} color="#059669" strokeWidth={2.2} />
                      <Text style={styles.specText}>{property.bathrooms} {language === 'fr' ? 'Salles de bain' : 'Baths'}</Text>
                    </View>
                  ) : null}
                  <View style={styles.spec}>
                    <Maximize size={18} color="#059669" strokeWidth={2.2} />
                    <Text style={styles.specText}>{property.area} m²</Text>
                  </View>
                </View>

                {/* Tab: OVERVIEW Content */}
                {(activeDetailTab === 'overview' || isDesktop) && (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{t('property_description') || 'Description'}</Text>
                      <Text style={styles.description}>{property.description}</Text>
                    </View>

                    {/* Features Snippet */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{t('property_features') || 'Commodités & Équipements'}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {property.features.map((feature, index) => (
                          <View key={index} style={styles.featurePillTag}>
                            <View style={styles.featurePillDot} />
                            <Text style={styles.featurePillText}>{feature}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Buyer to Seller Distance Widget */}
                    <BuyerDistanceWidget
                      propertyLat={property.location.coordinates.latitude}
                      propertyLng={property.location.coordinates.longitude}
                      propertyTitle={property.title}
                      propertyDistrict={property.location.district}
                      propertyCity={property.location.city}
                    />
                  </>
                )}

                {/* Tab: GALLERY Content */}
                {activeDetailTab === 'gallery' && !isDesktop && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{language === 'fr' ? 'Galerie Photos Complète' : 'Full Photo Gallery'}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {property.images.map((img, i) => (
                        <TouchableOpacity
                          key={i}
                          style={{ width: '48%', height: 120, borderRadius: 14, overflow: 'hidden' }}
                          onPress={() => setCurrentImageIndex(i)}
                          activeOpacity={0.88}
                        >
                          <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Tab: FEATURES Content */}
                {activeDetailTab === 'features' && !isDesktop && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{language === 'fr' ? 'Toutes les Commodités' : 'All Features & Amenities'}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                      {property.features.map((feature, index) => (
                        <View key={index} style={[styles.featurePillTag, { paddingVertical: 10, paddingHorizontal: 14 }]}>
                          <View style={styles.featurePillDot} />
                          <Text style={[styles.featurePillText, { fontSize: 13 }]}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Tab: LOCATION Content */}
                {(activeDetailTab === 'location' || isDesktop) && (
                  <>
                    <View style={{ marginTop: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text }}>
                          📍 {t('property_location') || 'Localisation & Quartier'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setIsMapVisible(true)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>
                            {t('view_on_map') || 'Plein écran'} ↗
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ height: 260, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <PropertyMap
                          properties={[property]}
                          showFilterBar={false}
                          showNearbyPOIs={true}
                          hideBottomCard={true}
                          centerCoordinates={{
                            latitude: property.location.coordinates.latitude,
                            longitude: property.location.coordinates.longitude,
                            zoom: 15,
                          }}
                        />
                      </View>
                    </View>

                    {/* Nearby Services */}
                    <NearbyServicesSection
                      latitude={property.location.coordinates.latitude}
                      longitude={property.location.coordinates.longitude}
                      maxDistanceKm={7}
                    />

                    {/* Area Price Stats */}
                    <View style={{ marginTop: 10 }}>
                      <AreaPriceStatsCard
                        stats={calculateAreaPriceStats(allProperties, property.location.district, property.location.city)}
                        onExplorePress={() => router.push(`/area/${property.location.city.toLowerCase()}/${property.location.district.toLowerCase()}` as any)}
                      />
                    </View>
                  </>
                )}
              </View>

              <View style={[styles.rightColumn, isDesktop && styles.rightColumnDesktop]}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('property_agent')}</Text>
                  <View style={styles.agentCard}>
                    <View style={styles.agentInfo}>
                      {property.agent.avatar ? (
                        <Image
                          source={{ uri: property.agent.avatar }}
                          style={styles.agentAvatar}
                        />
                      ) : (
                        <View style={styles.agentAvatarPlaceholder}>
                          <Text style={styles.agentAvatarText}>
                            {property.agent.name.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.agentDetails}>
                        <Text style={styles.agentName}>{property.agent.name}</Text>
                        <Text style={styles.agentPhone}>{property.agent.phone}</Text>
                      </View>
                    </View>
                    <View style={styles.agentActions}>
                      <TouchableOpacity
                        style={[styles.agentButton, { backgroundColor: '#059669' }]}
                        onPress={() => startOrGetConversation(property)}
                        activeOpacity={0.85}
                      >
                        <MessageSquare size={19} color={Colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.agentButton}
                        onPress={() => {
                          const clean = property.agent?.phone ? property.agent.phone.replace(/\D/g, '') : '';
                          if (!clean) return;
                          if (Platform.OS === 'web' && typeof window !== 'undefined') {
                            window.location.href = 'tel:' + clean;
                          } else {
                            Linking.openURL('tel:' + clean).catch(() => {});
                          }
                        }}
                      >
                        <Phone size={19} color={Colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.agentButton, { backgroundColor: '#25D366' }]}
                        onPress={() => {
                          const clean = property.agent?.phone ? property.agent.phone.replace(/\D/g, '') : '';
                          if (!clean) return;
                          Linking.openURL('https://wa.me/' + clean).catch(() => {});
                        }}
                      >
                        <MessageCircle size={19} color={Colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.agentButton}
                        onPress={() => {
                          if (Platform.OS === 'web' && typeof window !== 'undefined') {
                            window.location.href = 'mailto:contact@immoci.ci';
                          } else {
                            Linking.openURL('mailto:contact@immoci.ci').catch(() => {});
                          }
                        }}
                      >
                        <Mail size={19} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {isDesktop && (
                  <TouchableOpacity
                    style={styles.contactButtonDesktop}
                    onPress={() => startOrGetConversation(property)}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.contactButtonText}>{t('property_contact_agent') || 'Discuter avec l’Agent'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Similar Properties */}
          <View style={{ marginTop: 24, paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4, letterSpacing: -0.4 }}>Similar Properties</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 16 }}>You might also like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {allProperties.filter(p => p.id !== property.id && p.type === property.type).slice(0, 4).map(p => (
                <TouchableOpacity key={p.id} onPress={() => router.push(`/property/${p.id}`)} activeOpacity={0.9} style={{ width: 200 }}>
                  <Image source={{ uri: p.images[0] }} style={{ width: 200, height: 130, borderRadius: 12 }} resizeMode="cover" />
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 8 }}>{p.title}</Text>
                  <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 2 }}>{formatPriceCompact(p.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Desktop Web Footer */}
          {isDesktop && <WebFooter />}
        </ScrollView>

        {!isDesktop && (
          <View
            style={[
              styles.mobileStickyActionBar,
              { paddingBottom: Math.max(insets.bottom, 10) + 6 },
            ]}
          >
            <View style={styles.mobileStickyPriceBox}>
              <Text style={styles.mobileStickyPriceText}>
                {formatPrice(property.price, property.currency)}
              </Text>
              <Text style={styles.mobileStickySubText}>
                {property.status === 'rent' ? '/mois' : (property.area ? `${Math.round(property.price / property.area).toLocaleString()} FCFA/m²` : 'Prix direct')}
              </Text>
            </View>

            <View style={styles.mobileStickyActionBtns}>
              {/* In-App Live Chat Button */}
              <Button
                variant="secondary"
                size="sm"
                label="Chat"
                leftIcon={<MessageSquare size={IconSizes.actionSm} color="#059669" strokeWidth={IconStrokes.bold} />}
                onPress={() => startOrGetConversation(property)}
                style={{ flex: 1 }}
              />

              {/* WhatsApp Button */}
              <Button
                variant="whatsapp"
                size="sm"
                label="WhatsApp"
                leftIcon={<MessageCircle size={IconSizes.actionSm} color="#FFFFFF" strokeWidth={IconStrokes.bold} />}
                onPress={() => {
                  const phone = property.agent?.phone ? property.agent.phone.replace(/\D/g, '') : '';
                  if (!phone) return;
                  const text = encodeURIComponent(`Bonjour, je vous contacte au sujet de : ${property.title} (${formatPrice(property.price, property.currency)}) sur ImmoCI.`);
                  Linking.openURL(`https://wa.me/${phone}?text=${text}`).catch((err) => console.warn('[WhatsApp Error]:', err));
                }}
                style={{ flex: 1.25 }}
              />

              {/* Call Button */}
              <Button
                variant="primary"
                size="sm"
                label={t('call') || 'Appeler'}
                leftIcon={<Phone size={IconSizes.actionSm} color="#FFFFFF" strokeWidth={IconStrokes.bold} />}
                onPress={() => {
                  const clean = property.agent?.phone ? property.agent.phone.replace(/\D/g, '') : '';
                  if (!clean) return;
                  Linking.openURL('tel:' + clean).catch((err) => console.warn('[Call Error]:', err));
                }}
                style={{ flex: 1.1 }}
              />
            </View>
          </View>
        )}
      </View>

      <Modal
        visible={isMapVisible}
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <PropertyMap properties={[property]} />
          {/* In-app map header bar */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: insets.top + 8,
              paddingBottom: 10,
              paddingHorizontal: 16,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0,0,0,0.07)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MapPin size={18} color={Colors.primary} />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: Colors.text,
                  flex: 1,
                }}
              >
                {property.location.district}, {property.location.city}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.white,
                padding: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.08)',
                shadowColor: Colors.shadow.md,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 6,
                elevation: 4,
              }}
              onPress={() => setIsMapVisible(false)}
            >
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  notFoundText: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  imageContainer: {
    position: 'relative',
    height: 400,
    backgroundColor: Colors.background,
  },
  image: {
    height: 400,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease',
      },
    }),
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageIndicatorText: {
    ...Typography.caption,
    color: Colors.white,
  },
  content: {
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  thumbnailStripOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  thumbnailPill: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbnailPillActive: {
    borderColor: '#10B981',
    transform: [{ scale: 1.05 }],
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  thumbnailMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailMoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryCrownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  categoryCrownIcon: {
    fontSize: 12,
  },
  categoryCrownText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.2,
  },
  detailRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailRatingStar: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '800',
  },
  detailRatingScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  detailRatingCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  locationRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationSubtitleText: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  segmentedTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFEA',
    marginBottom: 16,
    gap: 4,
  },
  segmentedTabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
  },
  segmentedTabBtnActive: {},
  segmentedTabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentedTabTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  segmentedTabActiveUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#059669',
  },
  featurePillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F8FAF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EFE8',
  },
  featurePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  mainContent: {
    flexDirection: 'column',
  },
  mainContentDesktop: {
    flexDirection: 'row',
    gap: Spacing.xl,
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
  },
  leftColumnDesktop: {
    flex: 2,
  },
  rightColumn: {
    flex: 1,
  },
  rightColumnDesktop: {
    flex: 1,
    position: 'sticky' as any,
    top: Spacing.lg,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  price: {
    ...Typography.h1,
    color: Colors.primary,
  },
  priceUnit: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  statusText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary + '12',
    borderColor: Colors.primary + '28',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  locationChevronWrapper: {
    marginLeft: 2,
  },
  locationText: {
    ...Typography.body,
    color: Colors.primary,
    flex: 1,
    fontSize: 13,
  },
  specs: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0ECE4',
    marginBottom: 16,
  },
  spec: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAF8',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EFE9',
  },
  specText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  features: {
    gap: Spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text,
  },
  agentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 12,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  agentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  agentAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: {
    ...Typography.h3,
    color: Colors.white,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  agentPhone: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  agentActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  agentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
      },
    }),
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  contactButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  contactButtonDesktop: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease',
      },
    }),
  },
  contactButtonText: {
    ...Typography.button,
    color: Colors.white,
  },

  // ── MOBILE STICKY ACTION BAR ────────────────────────────────
  mobileStickyActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 100,
  },
  mobileStickyPriceBox: {
    flex: 1,
    paddingRight: 8,
  },
  mobileStickyPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  mobileStickySubText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 1,
  },
  mobileStickyActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileStickyChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  mobileStickyWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  mobileStickyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  mobileStickyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
