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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { mockProperties } from '@/mocks/properties';
import { getMaxContentWidth, useResponsive } from '@/constants/breakpoints';
import { useLanguage } from '@/providers/LanguageProvider';
import { openInGoogleMaps, openInWaze } from '@/utils/map';
import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';
import { Property } from '@/types/property';
import WebNavbar from '@/components/WebNavbar';
import NearbyServicesSection from '@/components/NearbyServicesSection';
import BuyerDistanceWidget from '@/components/BuyerDistanceWidget';
import AreaPriceStatsCard from '@/components/AreaPriceStatsCard';
import { calculateAreaPriceStats } from '@/utils/priceStats';
import { Platform } from 'react-native';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const { isDesktop } = useResponsive();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
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

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      return `${(price / 1000000).toFixed(1)}M FCFA`;
    }
    return `${price.toLocaleString()} ${currency} `;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {Platform.OS === 'web' && <WebNavbar />}
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
              >
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleBack}
                >
                  <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.headerButton}>
                    <Share2 size={22} color={Colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart
                      size={22}
                      color={isFavorite ? Colors.error : Colors.text}
                      fill={isFavorite ? Colors.error : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                {property.images.map((_, i) => (
                  <View key={i} style={{ width: i === currentImageIndex ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === currentImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </View>
            </View>
          </View>

          <View style={[
            styles.content,
            isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }
          ]}>
            <View style={[styles.mainContent, isDesktop && styles.mainContentDesktop]}>
              <View style={[styles.leftColumn, isDesktop && styles.leftColumnDesktop]}>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>
                    {formatPrice(property.price, property.currency)}
                    {property.status === 'rent' && (
                      <Text style={styles.priceUnit}>{t('property_per_month')}</Text>
                    )}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {property.status === 'sale' ? t('property_for_sale') : t('property_for_rent')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.title}>{property.title}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 }}>
                  <TouchableOpacity
                    style={[styles.locationPill, { flex: 1 }]}
                    onPress={handleLocationPress}
                    activeOpacity={0.75}
                  >
                    <MapPin size={16} color={Colors.primary} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {property.location.address}, {property.location.district},{' '}
                      {property.location.city}
                    </Text>
                    <View style={styles.locationChevronWrapper}>
                      <ChevronRight size={14} color={Colors.primary} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: Colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onPress={() => setIsMapVisible(true)}
                    activeOpacity={0.85}
                  >
                    <MapPin size={14} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                      {t('view_on_map') || 'Voir sur la carte'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.specs}>
                  {property.bedrooms && (
                    <View style={styles.spec}>
                      <Bed size={20} color={Colors.primary} />
                      <Text style={styles.specText}>{property.bedrooms} {t('property_bedrooms_short')}</Text>
                    </View>
                  )}
                  {property.bathrooms && (
                    <View style={styles.spec}>
                      <Bath size={20} color={Colors.primary} />
                      <Text style={styles.specText}>{property.bathrooms} {t('property_bathrooms_short')}</Text>
                    </View>
                  )}
                  <View style={styles.spec}>
                    <Maximize size={20} color={Colors.primary} />
                    <Text style={styles.specText}>{property.area}m²</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('property_description')}</Text>
                  <Text style={styles.description}>{property.description}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('property_features')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {property.features.map((feature, index) => (
                      <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.primary + '10', borderRadius: 20, borderWidth: 1, borderColor: Colors.primary + '25' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary }} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.primary }}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* ── Distance Between Buyer & Seller ────────────────── */}
                <BuyerDistanceWidget
                  propertyLat={property.location.coordinates.latitude}
                  propertyLng={property.location.coordinates.longitude}
                  propertyTitle={property.title}
                  propertyDistrict={property.location.district}
                  propertyCity={property.location.city}
                />

                {/* ── Embedded Property Location Map ─────────────────── */}
                <View style={{ marginTop: 14 }}>
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

                {/* ── Nearby Services & POIs Checklist ────────────────── */}
                <NearbyServicesSection
                  latitude={property.location.coordinates.latitude}
                  longitude={property.location.coordinates.longitude}
                  maxDistanceKm={7}
                />

                {/* ── Area Average Market Price Stats ────────────────── */}
                <View style={{ marginTop: 10 }}>
                  <AreaPriceStatsCard
                    stats={calculateAreaPriceStats(allProperties, property.location.district, property.location.city)}
                    onExplorePress={() => router.push(`/area/${property.location.city.toLowerCase()}/${property.location.district.toLowerCase()}` as any)}
                  />
                </View>
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
                      <TouchableOpacity style={styles.agentButton} onPress={() => { if (Platform.OS === 'web') { window.location.href = 'tel:' + property.agent.phone; } else { Linking.openURL('tel:' + property.agent.phone); } }}>
                        <Phone size={20} color={Colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.agentButton, { backgroundColor: '#25D366' }]} onPress={() => Linking.openURL('https://wa.me/' + property.agent.phone.replace(/\D/g,''))}>
                        <MessageCircle size={20} color={Colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.agentButton} onPress={() => { if (Platform.OS === 'web') { window.location.href = 'mailto:'; } else { Linking.openURL('mailto:'); } }}>
                        <Mail size={20} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {isDesktop && (
                  <TouchableOpacity style={styles.contactButtonDesktop}>
                    <Text style={styles.contactButtonText}>{t('property_contact_agent')}</Text>
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
                  <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 2 }}>{(p.price/1000000).toFixed(1)}M FCFA</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
                {property.status === 'rent' ? '/mois' : (property.area ? `${Math.round(property.price / property.area).toLocaleString()} F/m²` : 'Prix direct')}
              </Text>
            </View>

            <View style={styles.mobileStickyActionBtns}>
              {/* WhatsApp Button */}
              <TouchableOpacity
                style={styles.mobileStickyWhatsAppBtn}
                onPress={() => {
                  const phone = property.agent.phone.replace(/\D/g, '');
                  const text = encodeURIComponent(`Bonjour, je vous contacte au sujet de : ${property.title} (${formatPrice(property.price, property.currency)}) sur ImmoCI.`);
                  Linking.openURL(`https://wa.me/${phone}?text=${text}`);
                }}
                activeOpacity={0.88}
              >
                <MessageCircle size={18} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.mobileStickyBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              {/* Call Button */}
              <TouchableOpacity
                style={styles.mobileStickyCallBtn}
                onPress={() => Linking.openURL('tel:' + property.agent.phone.replace(/\D/g, ''))}
                activeOpacity={0.88}
              >
                <Phone size={17} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.mobileStickyBtnText}>
                  {t('call') || 'Appeler'}
                </Text>
              </TouchableOpacity>
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
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
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
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  specText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600' as const,
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
  },
  mobileStickyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
