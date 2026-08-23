import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { router } from 'expo-router';
import {
  MapPin,
  Navigation,
  Layers,
  Crosshair,
  X,
  Bed,
  Bath,
  Maximize2,
  Sparkles,
  Route,
  Compass,
  CheckCircle2,
  MessageCircle,
  Phone,
  Eye,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { Property } from '@/types/property';
import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';

interface PropertyMapProps {
  properties: Property[];
  initialSelectedId?: string;
  selectedId?: string | null;
  onPropertySelect?: (propertyId: string | null) => void;
  showFilterBar?: boolean;
  showNearbyPOIs?: boolean;
  centerCoordinates?: { latitude: number; longitude: number; zoom?: number };
  hideBottomCard?: boolean;
}

// Popular locations / districts in Ivory Coast with center coordinates
const POPULAR_PLACES = [
  { id: 'all', name: 'All Abidjan', nameFr: 'Tout Abidjan', lat: 5.359952, lng: -4.008256, delta: 0.12 },
  { id: 'cocody', name: 'Cocody', nameFr: 'Cocody', lat: 5.3599, lng: -4.0083, delta: 0.045 },
  { id: 'riviera', name: 'Riviera 3 & 4', nameFr: 'Riviera 3 & 4', lat: 5.3780, lng: -3.9720, delta: 0.045 },
  { id: 'plateau', name: 'Plateau', nameFr: 'Plateau', lat: 5.3247, lng: -4.0127, delta: 0.035 },
  { id: 'marcory', name: 'Marcory / Zone 4', nameFr: 'Marcory / Zone 4', lat: 5.2892, lng: -3.9847, delta: 0.04 },
  { id: 'deux_plateaux', name: '2 Plateaux', nameFr: '2 Plateaux', lat: 5.3650, lng: -4.0180, delta: 0.045 },
  { id: 'angre', name: 'Angré', nameFr: 'Angré', lat: 5.4050, lng: -3.9890, delta: 0.045 },
  { id: 'yopougon', name: 'Yopougon', nameFr: 'Yopougon', lat: 5.3400, lng: -4.0800, delta: 0.06 },
  { id: 'bingerville', name: 'Bingerville', nameFr: 'Bingerville', lat: 5.3560, lng: -3.8890, delta: 0.05 },
  { id: 'bassam', name: 'Grand-Bassam', nameFr: 'Grand-Bassam', lat: 5.2050, lng: -3.7380, delta: 0.06 },
  { id: 'assinie', name: 'Assinie', nameFr: 'Assinie', lat: 5.1320, lng: -3.2840, delta: 0.07 },
];

const RADIUS_OPTIONS = [
  { id: 'all', labelFr: 'Toutes distances', labelEn: 'Any distance', km: 999 },
  { id: '2', labelFr: '< 2 km', labelEn: '< 2 km', km: 2 },
  { id: '5', labelFr: '< 5 km', labelEn: '< 5 km', km: 5 },
  { id: '10', labelFr: '< 10 km', labelEn: '< 10 km', km: 10 },
  { id: '20', labelFr: '< 20 km', labelEn: '< 20 km', km: 20 },
];

// Haversine distance formula in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function estimateDriveTimeMin(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 28) * 60)); // ~28km/h average in Abidjan
}

export default function PropertyMapNative({
  properties,
  initialSelectedId,
  selectedId,
  onPropertySelect,
  showFilterBar = true,
  showNearbyPOIs = false,
  centerCoordinates,
  hideBottomCard = false,
}: PropertyMapProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const mapRef = useRef<MapView>(null);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('all');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    selectedId !== undefined ? selectedId : initialSelectedId || null
  );
  const [selectedRadiusId, setSelectedRadiusId] = useState<string>('all');
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
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

  // Request Native User Location
  const requestUserLocation = useCallback(async () => {
    setIsLocatingUser(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback location for demo
        setUserLocation({ latitude: 5.3485, longitude: -4.0125 });
        setIsLocatingUser(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);

      mapRef.current?.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        800
      );
    } catch (err) {
      console.warn('[Location Native] Error getting location:', err);
      setUserLocation({ latitude: 5.3485, longitude: -4.0125 });
    } finally {
      setIsLocatingUser(false);
    }
  }, []);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Filter by distance radius if selected
  const filteredProperties = useMemo(() => {
    const selectedRadius = RADIUS_OPTIONS.find((r) => r.id === selectedRadiusId);
    if (!selectedRadius || selectedRadius.id === 'all' || !userLocation) {
      return validProperties;
    }
    return validProperties.filter((p) => {
      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        p.location.coordinates.latitude,
        p.location.coordinates.longitude
      );
      return dist <= selectedRadius.km;
    });
  }, [validProperties, selectedRadiusId, userLocation]);

  const selectedProperty = useMemo(() => {
    return filteredProperties.find((p) => p.id === internalSelectedId) || null;
  }, [filteredProperties, internalSelectedId]);

  useEffect(() => {
    if (selectedId !== undefined) {
      setInternalSelectedId(selectedId);
      if (selectedId) {
        const found = validProperties.find(p => p.id === selectedId);
        if (found) {
          mapRef.current?.animateToRegion({
            latitude: found.location.coordinates.latitude,
            longitude: found.location.coordinates.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 800);
        }
      }
    }
  }, [selectedId, validProperties]);

  // Default region: Abidjan
  const defaultRegion: Region = {
    latitude: centerCoordinates?.latitude || 5.359952,
    longitude: centerCoordinates?.longitude || -4.008256,
    latitudeDelta: 0.12,
    longitudeDelta: 0.08,
  };

  useEffect(() => {
    if (selectedProperty && !hideBottomCard) {
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
  }, [selectedProperty, hideBottomCard, cardSlideAnim]);

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

  const selectProperty = (id: string | null) => {
    setInternalSelectedId(id);
    if (onPropertySelect) onPropertySelect(id);
  };

  const handlePlaceSelect = (place: (typeof POPULAR_PLACES)[0]) => {
    setSelectedPlaceId(place.id);
    mapRef.current?.animateToRegion(
      {
        latitude: place.lat,
        longitude: place.lng,
        latitudeDelta: place.delta,
        longitudeDelta: place.delta,
      },
      700
    );

    // If district is specific, focus first matching property
    if (place.id !== 'all') {
      const match = filteredProperties.find(
        (p) =>
          p.location.district.toLowerCase().includes(place.id.toLowerCase()) ||
          p.location.city.toLowerCase().includes(place.id.toLowerCase()) ||
          p.title.toLowerCase().includes(place.id.toLowerCase())
      );
      if (match) {
        selectProperty(match.id);
      }
    }
  };

  const handleMarkerPress = (property: Property) => {
    selectProperty(property.id);
    mapRef.current?.animateToRegion(
      {
        latitude: property.location.coordinates.latitude - 0.006, // offset slightly for bottom sheet
        longitude: property.location.coordinates.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      500
    );
  };

  const openGoogleMapsDirection = (propLat: number, propLng: number) => {
    let url = `https://www.google.com/maps/dir/?api=1&destination=${propLat},${propLng}&travelmode=driving`;
    if (userLocation) {
      url += `&origin=${userLocation.latitude},${userLocation.longitude}`;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Google Maps', 'Impossible d\'ouvrir Google Maps');
    });
  };

  const handleWhatsAppContact = (phone: string, title: string, distanceKm?: number) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const distText = distanceKm ? ` (je suis à environ ${distanceKm} km)` : '';
    const text = encodeURIComponent(
      language === 'fr'
        ? `Bonjour, je vous contacte concernant votre annonce '${title}' sur ImmoCI${distText}. Est-elle toujours disponible pour une visite ?`
        : `Hello, I am contacting you regarding your listing '${title}' on ImmoCI${distText}. Is it available for a visit?`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`);
  };

  const handleRecenter = () => {
    setSelectedPlaceId('all');
    mapRef.current?.animateToRegion(defaultRegion, 700);
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === 'standard' ? 'hybrid' : 'standard'));
  };

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
        {/* Connecting Dashed Line from Buyer to Selected Property */}
        {userLocation && selectedProperty && (
          <Polyline
            coordinates={[
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
              {
                latitude: selectedProperty.location.coordinates.latitude,
                longitude: selectedProperty.location.coordinates.longitude,
              },
            ]}
            strokeColor="#059669"
            strokeWidth={3}
            lineDashPattern={[6, 6]}
          />
        )}

        {/* Property Price Bubble Markers (Emerald Green matching screenshot) */}
        {filteredProperties.map((property) => {
          const isSelected = internalSelectedId === property.id;
          const isSale = property.status === 'sale';
          const isFeatured = property.isFeatured || property.price > 100000000;

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
              <View style={[styles.markerAnchor, isSelected && styles.markerAnchorActive]}>
                <View
                  style={[
                    styles.priceBubble,
                    isFeatured && styles.priceBubbleFeatured,
                    !isSale && styles.priceBubbleRent,
                    isSelected && styles.priceBubbleActive,
                  ]}
                >
                  {isFeatured && <Text style={styles.bubbleStar}>⭐</Text>}
                  <Text style={styles.priceBubbleText}>
                    {formatPriceBadge(property.price, property.currency)}
                  </Text>
                  <Text style={styles.bubbleCheck}>✔️</Text>
                </View>
                <View
                  style={[
                    styles.priceTail,
                    isFeatured && styles.priceTailFeatured,
                    !isSale && styles.priceTailRent,
                    isSelected && styles.priceTailActive,
                  ]}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── TOP PLACES & RADIUS BAR ───────────────────────────────── */}
      <View style={[styles.topBarContainer, { top: insets.top > 0 ? 8 : 12 }]}>
        {/* Popular Districts Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.placeChipsScroll}
        >
          {/* GPS Radar Pill */}
          <TouchableOpacity
            style={[
              styles.placeChip,
              styles.gpsPlaceChip,
              userLocation && styles.gpsPlaceChipActive,
            ]}
            onPress={requestUserLocation}
            activeOpacity={0.8}
          >
            {isLocatingUser ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Crosshair size={14} color={userLocation ? '#059669' : '#64748B'} strokeWidth={2.4} />
            )}
            <Text style={[styles.placeChipText, userLocation && { color: '#059669', fontWeight: '800' }]}>
              {userLocation ? '📍 Ma Position' : 'Localiser (GPS)'}
            </Text>
          </TouchableOpacity>

          {POPULAR_PLACES.map((place) => {
            const isActive = selectedPlaceId === place.id;
            const placeLabel = language === 'fr' ? place.nameFr : place.name;
            return (
              <TouchableOpacity
                key={place.id}
                style={[styles.placeChip, isActive && styles.placeChipActive]}
                onPress={() => handlePlaceSelect(place)}
                activeOpacity={0.75}
              >
                <Text style={[styles.placeChipText, isActive && styles.placeChipTextActive]}>
                  {placeLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Distance Radius Filter Row */}
        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>
            {language === 'fr' ? 'Rayon :' : 'Radius:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusScroll}>
            {RADIUS_OPTIONS.map((radius) => {
              const isSelected = selectedRadiusId === radius.id;
              return (
                <TouchableOpacity
                  key={radius.id}
                  style={[styles.radiusPill, isSelected && styles.radiusPillActive]}
                  onPress={() => setSelectedRadiusId(radius.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.radiusPillText, isSelected && styles.radiusPillTextActive]}>
                    {language === 'fr' ? radius.labelFr : radius.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ── FLOATING CONTROLS (Right Side) ────────────────────────── */}
      <View style={styles.floatingControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMapType} activeOpacity={0.8}>
          <Layers size={18} color="#0F172A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleRecenter} activeOpacity={0.8}>
          <Navigation size={18} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM PREVIEW CARD (Selected Property) ───────────────── */}
      {selectedProperty && (
        <Animated.View
          style={[
            styles.bottomCardWrapper,
            {
              transform: [
                {
                  translateY: cardSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [320, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.bottomCard}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeCardBtn}
              onPress={() => selectProperty(null)}
              activeOpacity={0.8}
            >
              <X size={15} color="#64748B" strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.cardMainRow}>
              <TouchableOpacity
                onPress={() => router.push(`/property/${selectedProperty.id}`)}
                activeOpacity={0.9}
                style={styles.cardImageContainer}
              >
                <Image source={{ uri: selectedProperty.images[0] }} style={styles.cardThumb} />
                <View style={styles.cardStatusBadge}>
                  <Text style={styles.cardStatusBadgeText}>
                    {selectedProperty.status === 'sale' ? 'VENTE' : 'LOCATION'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.cardDetails}>
                <View style={styles.cardPriceRow}>
                  <Text style={styles.cardPrice}>
                    {formatPriceFull(selectedProperty.price, selectedProperty.currency)}
                  </Text>
                  <View style={styles.cardAcdBadge}>
                    <CheckCircle2 size={11} color="#059669" />
                    <Text style={styles.cardAcdBadgeText}>ACD Vérifié</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>
                  {selectedProperty.title}
                </Text>

                <View style={styles.cardLocRow}>
                  <MapPin size={12} color="#64748B" />
                  <Text style={styles.cardLocText}>
                    {selectedProperty.location.district}, {selectedProperty.location.city}
                  </Text>
                </View>

                {/* Distance Badge */}
                {userLocation && (
                  <View style={styles.distanceBadgeRow}>
                    <Route size={12} color="#059669" />
                    <Text style={styles.distanceBadgeText}>
                      À {calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude)} km de vous (~{estimateDriveTimeMin(calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude))} min)
                    </Text>
                  </View>
                )}

                {/* Specs */}
                <View style={styles.cardSpecsRow}>
                  {selectedProperty.bedrooms ? (
                    <Text style={styles.cardSpecText}>🛏️ {selectedProperty.bedrooms} ch</Text>
                  ) : null}
                  {selectedProperty.bathrooms ? (
                    <Text style={styles.cardSpecText}>🚿 {selectedProperty.bathrooms} sdb</Text>
                  ) : null}
                  <Text style={styles.cardSpecText}>📐 {selectedProperty.area} m²</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons: Google Maps Navigation + WhatsApp + Voir */}
            <View style={styles.cardActionGrid}>
              <TouchableOpacity
                style={styles.gmapsNavBtn}
                onPress={() => openGoogleMapsDirection(selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude)}
                activeOpacity={0.85}
              >
                <Compass size={15} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.gmapsNavBtnText}>Google Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={() => {
                  const dist = userLocation
                    ? calculateDistanceKm(
                        userLocation.latitude,
                        userLocation.longitude,
                        selectedProperty.location.coordinates.latitude,
                        selectedProperty.location.coordinates.longitude
                      )
                    : undefined;
                  handleWhatsAppContact(selectedProperty.agent.phone, selectedProperty.title, dist);
                }}
                activeOpacity={0.85}
              >
                <MessageCircle size={15} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewDetailBtn}
                onPress={() => router.push(`/property/${selectedProperty.id}`)}
                activeOpacity={0.85}
              >
                <Eye size={15} color="#059669" strokeWidth={2.4} />
                <Text style={styles.viewDetailBtnText}>Voir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Emerald Price Bubble Marker ────────────────────────────────
  markerAnchor: {
    alignItems: 'center',
  },
  markerAnchorActive: {
    transform: [{ scale: 1.18 }],
    zIndex: 999,
  },
  priceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  priceBubbleFeatured: {
    backgroundColor: '#047857',
    borderColor: '#FCD34D',
  },
  priceBubbleRent: {
    backgroundColor: '#0D9488',
  },
  priceBubbleActive: {
    backgroundColor: '#064E3B',
    borderColor: '#F59E0B',
  },
  priceBubbleText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  bubbleStar: {
    fontSize: 10,
  },
  bubbleCheck: {
    fontSize: 9,
  },
  priceTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#059669',
    marginTop: -1,
  },
  priceTailFeatured: {
    borderTopColor: '#047857',
  },
  priceTailRent: {
    borderTopColor: '#0D9488',
  },
  priceTailActive: {
    borderTopColor: '#064E3B',
  },

  // ── Top Bar Container ──────────────────────────────────────────
  topBarContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  placeChipsScroll: {
    gap: 8,
    alignItems: 'center',
    paddingBottom: 4,
  },
  placeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  placeChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  placeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  placeChipTextActive: {
    color: '#FFFFFF',
  },
  gpsPlaceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  gpsPlaceChipActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#059669',
  },

  // Radius row
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  radiusLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusScroll: {
    gap: 6,
  },
  radiusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radiusPillActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: '#059669',
  },
  radiusPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  radiusPillTextActive: {
    color: '#059669',
    fontWeight: '800',
  },

  // ── Floating Controls ──────────────────────────────────────────
  floatingControls: {
    position: 'absolute',
    right: 16,
    top: 140,
    gap: 10,
  },
  controlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // ── Bottom Preview Card ────────────────────────────────────────
  bottomCardWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    maxWidth: 580,
    alignSelf: 'center',
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  closeCardBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardImageContainer: {
    width: 95,
    height: 95,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cardThumb: {
    width: '100%',
    height: '100%',
  },
  cardStatusBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardStatusBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDetails: {
    flex: 1,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 24,
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardAcdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardAcdBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
  },
  cardLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  cardLocText: {
    fontSize: 11,
    color: '#64748B',
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  distanceBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  cardSpecsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardSpecText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // Action buttons
  cardActionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  gmapsNavBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    borderRadius: 10,
  },
  gmapsNavBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  whatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 10,
  },
  whatsAppBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewDetailBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
});
