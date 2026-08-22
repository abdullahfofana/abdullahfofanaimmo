import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { router } from 'expo-router';
import {
  MapPin,
  Navigation,
  Layers,
  Crosshair,
  X,
  ChevronRight,
  Bed,
  Bath,
  Maximize2,
  Sparkles,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Property } from '@/types/property';
import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';

interface PropertyMapProps {
  properties: Property[];
  initialSelectedId?: string;
}

// Popular locations / districts in Ivory Coast with center coordinates
const POPULAR_PLACES = [
  { id: 'all', name: 'All Abidjan', nameFr: 'Tout Abidjan', lat: 5.359952, lng: -4.008256, delta: 0.12 },
  { id: 'cocody', name: 'Cocody', nameFr: 'Cocody', lat: 5.3599, lng: -4.0083, delta: 0.045 },
  { id: 'plateau', name: 'Plateau', nameFr: 'Plateau', lat: 5.3247, lng: -4.0127, delta: 0.035 },
  { id: 'marcory', name: 'Marcory / Zone 4', nameFr: 'Marcory / Zone 4', lat: 5.2892, lng: -3.9847, delta: 0.04 },
  { id: 'riviera', name: 'Riviera / Angré', nameFr: 'Riviera / Angré', lat: 5.3850, lng: -3.9750, delta: 0.045 },
  { id: 'yopougon', name: 'Yopougon', nameFr: 'Yopougon', lat: 5.3400, lng: -4.0800, delta: 0.06 },
  { id: 'bingerville', name: 'Bingerville', nameFr: 'Bingerville', lat: 5.3560, lng: -3.8890, delta: 0.05 },
  { id: 'bassam', name: 'Grand-Bassam', nameFr: 'Grand-Bassam', lat: 5.2050, lng: -3.7380, delta: 0.06 },
  { id: 'assinie', name: 'Assinie', nameFr: 'Assinie', lat: 5.1320, lng: -3.2840, delta: 0.07 },
];

export default function PropertyMap({ properties, initialSelectedId }: PropertyMapProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const mapRef = useRef<MapView>(null);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(initialSelectedId || null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const cardSlideAnim = useRef(new Animated.Value(0)).current;

  // Filter valid properties with coordinates
  const validProperties = useMemo(() => {
    return properties.filter(
      (p) =>
        p.location?.coordinates?.latitude != null &&
        p.location?.coordinates?.longitude != null &&
        !isNaN(p.location.coordinates.latitude) &&
        !isNaN(p.location.coordinates.longitude)
    );
  }, [properties]);

  const selectedProperty = useMemo(() => {
    return validProperties.find((p) => p.id === selectedPropertyId) || null;
  }, [validProperties, selectedPropertyId]);

  // Default region: Abidjan
  const defaultRegion: Region = {
    latitude: 5.359952,
    longitude: -4.008256,
    latitudeDelta: 0.12,
    longitudeDelta: 0.08,
  };

  useEffect(() => {
    if (selectedProperty) {
      Animated.spring(cardSlideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedProperty, cardSlideAnim]);

  const formatPriceBadge = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}B`;
      if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)}M`;
      if (price >= 1_000) return `${(price / 1_000).toFixed(0)}k`;
      return `${price}`;
    }
    return `${price.toLocaleString()}`;
  };

  const formatPriceFull = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} Mrd FCFA`;
      return `${(price / 1_000_000).toFixed(1)}M FCFA`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  const handlePlaceSelect = (place: typeof POPULAR_PLACES[0]) => {
    setSelectedPlaceId(place.id);
    mapRef.current?.animateToRegion(
      {
        latitude: place.lat,
        longitude: place.lng,
        latitudeDelta: place.delta,
        longitudeDelta: place.delta * 0.8,
      },
      700
    );

    // If there are properties in that place, select the first one
    if (place.id !== 'all') {
      const match = validProperties.find((p) =>
        p.location.district.toLowerCase().includes(place.id.toLowerCase()) ||
        p.location.city.toLowerCase().includes(place.id.toLowerCase()) ||
        p.title.toLowerCase().includes(place.id.toLowerCase())
      );
      if (match) {
        setSelectedPropertyId(match.id);
      }
    }
  };

  const handleMarkerPress = (property: Property) => {
    setSelectedPropertyId(property.id);
    mapRef.current?.animateToRegion(
      {
        latitude: property.location.coordinates.latitude - 0.005, // offset slightly to show bottom card
        longitude: property.location.coordinates.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      500
    );
  };

  const handleRecenter = () => {
    setSelectedPlaceId('all');
    mapRef.current?.animateToRegion(defaultRegion, 700);
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === 'standard' ? 'hybrid' : 'standard'));
  };

  const cardTranslateY = cardSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [260, 0],
  });

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={defaultRegion}
        mapType={mapType}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {validProperties.map((property) => {
          const isSelected = selectedPropertyId === property.id;
          const isSale = property.status === 'sale';

          return (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.location.coordinates.latitude,
                longitude: property.location.coordinates.longitude,
              }}
              tracksViewChanges={false}
              onPress={() => handleMarkerPress(property)}
              zIndex={isSelected ? 99 : 10}
            >
              <View style={styles.markerAnchor}>
                <View
                  style={[
                    styles.pricePill,
                    {
                      backgroundColor: isSelected
                        ? colors.accent || '#C9933A'
                        : isSale
                        ? colors.primary
                        : '#1D4ED8',
                      borderColor: '#FFFFFF',
                      transform: [{ scale: isSelected ? 1.15 : 1 }],
                    },
                  ]}
                >
                  {isSelected && <Sparkles size={10} color="#FFFFFF" style={{ marginRight: 3 }} />}
                  <Text style={styles.pricePillText}>
                    {formatPriceBadge(property.price, property.currency)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.markerPinTail,
                    {
                      borderTopColor: isSelected
                        ? colors.accent || '#C9933A'
                        : isSale
                        ? colors.primary
                        : '#1D4ED8',
                    },
                  ]}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── TOP PLACES HORIZONTAL PILL BAR ───────────────────────── */}
      <View style={[styles.topBarContainer, { top: insets.top > 0 ? 8 : 12 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.placeChipsScroll}
        >
          {POPULAR_PLACES.map((place) => {
            const isActive = selectedPlaceId === place.id;
            const placeLabel = language === 'fr' ? place.nameFr : place.name;
            return (
              <TouchableOpacity
                key={place.id}
                style={[
                  styles.placeChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handlePlaceSelect(place)}
                activeOpacity={0.85}
              >
                <MapPin
                  size={12}
                  color={isActive ? '#FFFFFF' : colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.placeChipText,
                    { color: isActive ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {placeLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── MAP FLOATING UTILITY CONTROLS (Right side) ───────────── */}
      <View style={[styles.controlsContainer, { top: insets.top > 0 ? 60 : 64 }]}>
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: colors.surface }]}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <Crosshair size={18} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: colors.surface, marginTop: 8 }]}
          onPress={toggleMapType}
          activeOpacity={0.8}
        >
          <Layers size={18} color={mapType === 'hybrid' ? colors.accent : colors.text} />
        </TouchableOpacity>

        <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.countBadgeText, { color: colors.primary }]}>
            {validProperties.length}
          </Text>
          <Text style={[styles.countBadgeLabel, { color: colors.textSecondary }]}>biens</Text>
        </View>
      </View>

      {/* ── FLOATING BOTTOM PROPERTY PREVIEW CARD ────────────────── */}
      {selectedProperty && (
        <Animated.View
          style={[
            styles.bottomCardWrapper,
            { transform: [{ translateY: cardTranslateY }] },
          ]}
        >
          <View style={[styles.propertyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Close card button */}
            <TouchableOpacity
              style={[styles.closeCardBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={() => setSelectedPropertyId(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={14} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardInner}
              onPress={() => router.push(`/property/${selectedProperty.id}`)}
              activeOpacity={0.92}
            >
              <Image
                source={{ uri: selectedProperty.images[0] }}
                style={styles.cardImage}
                resizeMode="cover"
              />

              <View style={styles.cardContent}>
                <View style={styles.cardStatusRow}>
                  <View
                    style={[
                      styles.cardStatusBadge,
                      {
                        backgroundColor:
                          selectedProperty.status === 'sale'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(37, 99, 235, 0.12)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardStatusText,
                        {
                          color:
                            selectedProperty.status === 'sale' ? '#059669' : '#1D4ED8',
                        },
                      ]}
                    >
                      {selectedProperty.status === 'sale' ? 'À VENDRE' : 'À LOUER'}
                    </Text>
                  </View>
                  <Text style={[styles.cardPrice, { color: colors.primary }]}>
                    {formatPriceFull(selectedProperty.price, selectedProperty.currency)}
                  </Text>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedProperty.title}
                </Text>

                <View style={styles.cardLocationRow}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={[styles.cardLocationText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {selectedProperty.location.district}, {selectedProperty.location.city}
                  </Text>
                </View>

                <View style={styles.cardSpecsRow}>
                  {!!selectedProperty.bedrooms && (
                    <View style={styles.cardSpecItem}>
                      <Bed size={12} color={colors.primary} />
                      <Text style={[styles.cardSpecText, { color: colors.text }]}>
                        {selectedProperty.bedrooms} ch
                      </Text>
                    </View>
                  )}
                  {!!selectedProperty.bathrooms && (
                    <View style={styles.cardSpecItem}>
                      <Bath size={12} color={colors.primary} />
                      <Text style={[styles.cardSpecText, { color: colors.text }]}>
                        {selectedProperty.bathrooms} sdb
                      </Text>
                    </View>
                  )}
                  <View style={styles.cardSpecItem}>
                    <Maximize2 size={12} color={colors.primary} />
                    <Text style={[styles.cardSpecText, { color: colors.text }]}>
                      {selectedProperty.area} m²
                    </Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.detailActionBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.detailActionText}>Voir</Text>
                    <ChevronRight size={12} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  map: {
    width: '100%',
    height: '100%',
  },

  // ── Marker Styles ───────────────────────────────────────────────
  markerAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 6,
  },
  pricePillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: -0.2,
  },
  markerPinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
    alignSelf: 'center',
  },

  // ── Top Places Pill Bar ─────────────────────────────────────────
  topBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
  },
  placeChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  placeChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },

  // ── Map Controls ────────────────────────────────────────────────
  controlsContainer: {
    position: 'absolute',
    right: 14,
    zIndex: 20,
    alignItems: 'center',
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  countBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  countBadgeLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: -2,
  },

  // ── Bottom Property Card ────────────────────────────────────────
  bottomCardWrapper: {
    position: 'absolute',
    bottom: 85,
    left: 14,
    right: 14,
    zIndex: 30,
  },
  propertyCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: 'rgba(10,25,18,0.22)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
  },
  closeCardBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 10,
    gap: 12,
  },
  cardImage: {
    width: 105,
    height: 105,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 22,
  },
  cardStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardLocationText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  cardSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  cardSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardSpecText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  detailActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

