import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT, Region } from 'react-native-maps';
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
  SlidersHorizontal,
  ArrowLeft,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  MessageCircle,
  Phone,
  Eye,
  Compass,
  Route,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { Property } from '@/types/property';
import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { formatPriceCompact, formatPriceFull } from '@/utils/currency';

// ─────────────────────────────────────────────────────────────────────────────
// Map Error Boundary (Guarantees zero-blank screen in APK)
// ─────────────────────────────────────────────────────────────────────────────
class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('[PropertyMapNative] MapView error caught:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorFallbackContainer}>
          <View style={styles.errorCard}>
            <MapPin size={32} color="#059669" />
            <Text style={styles.errorTitle}>Mode carte sécurisé</Text>
            <Text style={styles.errorSub}>
              Chargement des coordonnées géographiques en cours...
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => this.setState({ hasError: false })}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>Actualiser la carte</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

export interface PropertyMapProps {
  properties: Property[];
  initialSelectedId?: string;
  selectedId?: string | null;
  onPropertySelect?: (propertyId: string | null) => void;
  showFilterBar?: boolean;
  showNearbyPOIs?: boolean;
  centerCoordinates?: { latitude: number; longitude: number; zoom?: number };
  hideBottomCard?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onFilterPress?: () => void;
  onBackPress?: () => void;
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
  const R = 6371;
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
  centerCoordinates,
  hideBottomCard = false,
  searchQuery: externalSearchQuery,
  onSearchChange,
  onFilterPress,
  onBackPress,
}: PropertyMapProps) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const loc = (fr: string, en: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  const mapRef = useRef<MapView>(null);

  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('all');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    selectedId !== undefined ? selectedId : initialSelectedId || null
  );
  const [selectedRadiusId, setSelectedRadiusId] = useState<string>('all');
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [showDistrictsBar, setShowDistrictsBar] = useState<boolean>(true);
  const cardSlideAnim = useRef(new Animated.Value(0)).current;

  // Filter valid properties with coordinates
  const validProperties = useMemo(() => {
    return properties.filter(
      (p) =>
        p?.location?.coordinates?.latitude != null &&
        p?.location?.coordinates?.longitude != null &&
        !isNaN(Number(p.location.coordinates.latitude)) &&
        !isNaN(Number(p.location.coordinates.longitude))
    );
  }, [properties]);

  // Real-time continuous GPS tracking
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    async function startWatching() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setHasLocationPermission(false);
            setUserLocation({ latitude: 5.3485, longitude: -4.0125 });
          }
          return;
        }

        if (isMounted) setHasLocationPermission(true);

        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (isMounted && initial?.coords) {
          setUserLocation({
            latitude: Number(initial.coords.latitude.toFixed(6)),
            longitude: Number(initial.coords.longitude.toFixed(6)),
          });
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 4000,
            distanceInterval: 15,
          },
          (loc) => {
            if (isMounted && loc?.coords) {
              setUserLocation({
                latitude: Number(loc.coords.latitude.toFixed(6)),
                longitude: Number(loc.coords.longitude.toFixed(6)),
              });
            }
          }
        );
      } catch (err) {
        console.warn('[Realtime GPS Watch]:', err);
      }
    }

    startWatching();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  // Filter properties by search query & radius
  const filteredProperties = useMemo(() => {
    let list = validProperties;

    // Filter by text search if present
    if (activeSearch && activeSearch.trim().length > 0) {
      const q = activeSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.district.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.location.address.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }

    // Filter by distance radius if selected
    const selectedRadius = RADIUS_OPTIONS.find((r) => r.id === selectedRadiusId);
    if (selectedRadius && selectedRadius.id !== 'all' && userLocation) {
      list = list.filter((p) => {
        const dist = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          p.location.coordinates.latitude,
          p.location.coordinates.longitude
        );
        return dist <= selectedRadius.km;
      });
    }

    return list;
  }, [validProperties, activeSearch, selectedRadiusId, userLocation]);

  const selectedProperty = useMemo(() => {
    return filteredProperties.find((p) => p.id === internalSelectedId) || null;
  }, [filteredProperties, internalSelectedId]);

  // Sync external selectedId
  useEffect(() => {
    if (selectedId !== undefined) {
      setInternalSelectedId(selectedId);
      if (selectedId) {
        const found = validProperties.find((p) => p.id === selectedId);
        if (found) {
          mapRef.current?.animateToRegion(
            {
              latitude: found.location.coordinates.latitude - 0.005,
              longitude: found.location.coordinates.longitude,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            },
            700
          );
        }
      }
    }
  }, [selectedId, validProperties]);

  // Default region: Center of Abidjan
  const defaultRegion: Region = useMemo(() => ({
    latitude: centerCoordinates?.latitude || 5.359952,
    longitude: centerCoordinates?.longitude || -4.008256,
    latitudeDelta: 0.12,
    longitudeDelta: 0.08,
  }), [centerCoordinates]);

  // Bottom preview card slide animation
  useEffect(() => {
    if (selectedProperty && !hideBottomCard) {
      Animated.spring(cardSlideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 55,
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
        latitude: property.location.coordinates.latitude - 0.006, // offset so card doesn't cover marker
        longitude: property.location.coordinates.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
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
      Alert.alert('Navigation', 'Impossible d\'ouvrir Google Maps');
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
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        700
      );
    } else {
      setSelectedPlaceId('all');
      mapRef.current?.animateToRegion(defaultRegion, 700);
    }
  };

  const handleZoomIn = () => {
    mapRef.current?.getCamera().then((camera) => {
      if (camera && camera.zoom !== undefined) {
        mapRef.current?.animateCamera({ zoom: Math.min((camera.zoom || 14) + 1.2, 20) }, { duration: 300 });
      }
    }).catch(() => {});
  };

  const handleZoomOut = () => {
    mapRef.current?.getCamera().then((camera) => {
      if (camera && camera.zoom !== undefined) {
        mapRef.current?.animateCamera({ zoom: Math.max((camera.zoom || 14) - 1.2, 3) }, { duration: 300 });
      }
    }).catch(() => {});
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === 'standard' ? 'hybrid' : 'standard'));
  };

  const handleSearchTextChange = (text: string) => {
    if (onSearchChange) {
      onSearchChange(text);
    } else {
      setInternalSearchQuery(text);
    }
  };

  return (
    <View style={styles.container}>
      <MapErrorBoundary>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={defaultRegion}
          mapType={mapType}
          showsUserLocation={hasLocationPermission}
          showsMyLocationButton={false}
          showsCompass={true}
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}
          moveOnMarkerPress={false}
          loadingEnabled={true}
        >
          {/* Universal Clean Light CartoDB Voyager Tiles (Matches UI Reference & 100% Reliable in APK) */}
          {mapType === 'standard' && (
            <UrlTile
              urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              maximumZ={19}
              shouldReplaceMapContent={true}
              zIndex={1}
            />
          )}

          {/* Polyline from User Location to Selected Property */}
          {userLocation?.latitude != null &&
            !isNaN(userLocation.latitude) &&
            selectedProperty?.location?.coordinates?.latitude != null &&
            !isNaN(selectedProperty.location.coordinates.latitude) && (
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
                zIndex={20}
              />
            )}

          {/* Live User GPS Radar Marker */}
          {userLocation?.latitude != null && !isNaN(userLocation.latitude) && (
            <Marker
              coordinate={userLocation}
              title="Votre position"
              description="Position GPS actuelle"
              zIndex={9999}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userRadarWrapper}>
                <View style={styles.userRadarPulse} />
                <View style={styles.userRadarDot}>
                  <Navigation size={10} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>
            </Marker>
          )}

          {/* ── PROPERTY PRICE PILL MARKERS (Exact Match to UI Reference) ───────────────── */}
          {filteredProperties.map((property) => {
            const coords = property?.location?.coordinates;
            if (
              !coords ||
              coords.latitude == null ||
              coords.longitude == null ||
              isNaN(Number(coords.latitude)) ||
              isNaN(Number(coords.longitude))
            ) {
              return null;
            }

            const isSelected = internalSelectedId === property.id;
            const priceText = formatPriceCompact(property.price);

            return (
              <Marker
                key={property.id}
                coordinate={{
                  latitude: Number(coords.latitude),
                  longitude: Number(coords.longitude),
                }}
                tracksViewChanges={false}
                onPress={() => handleMarkerPress(property)}
                zIndex={isSelected ? 999 : 10}
                anchor={{ x: 0.5, y: 1.0 }} // Pin the bottom arrow tip directly to coordinates
              >
                <View style={[styles.markerWrapper, isSelected && styles.markerWrapperActive]}>
                  {/* White Pill Badge */}
                  <View style={[styles.pricePill, isSelected && styles.pricePillActive]}>
                    <Text style={[styles.pricePillText, isSelected && styles.pricePillTextActive]}>
                      {priceText}
                    </Text>
                  </View>
                  {/* Bottom Triangle Arrow Pointer */}
                  <View style={[styles.markerPointer, isSelected && styles.markerPointerActive]} />
                </View>
              </Marker>
            );
          })}
        </MapView>
      </MapErrorBoundary>

      {/* ── FLOATING TOP SEARCH CARD (Exact Match to UI Reference: "Where to buy home ?") ── */}
      <View
        style={[
          styles.topFloatingHeader,
          { top: insets.top > 0 ? insets.top + 6 : 14 },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.searchBarCard}>
          {/* Back / Search Leading Button */}
          <TouchableOpacity
            style={styles.searchLeadingBtn}
            onPress={() => {
              if (onBackPress) {
                onBackPress();
              } else if (router.canGoBack()) {
                router.back();
              }
            }}
            activeOpacity={0.7}
          >
            {onBackPress ? (
              <ArrowLeft size={19} color="#0F172A" strokeWidth={2.4} />
            ) : (
              <Search size={18} color="#64748B" strokeWidth={2.4} />
            )}
          </TouchableOpacity>

          {/* Search Input */}
          <TextInput
            style={styles.searchTextInput}
            placeholder={loc('Où chercher votre bien ?', 'Where to look for property?', 'أين تبحث عن عقارك؟')}
            placeholderTextColor="#94A3B8"
            value={activeSearch}
            onChangeText={handleSearchTextChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />

          {activeSearch.length > 0 && !onSearchChange && (
            <TouchableOpacity
              onPress={() => handleSearchTextChange('')}
              style={styles.clearSearchBtn}
            >
              <X size={15} color="#94A3B8" strokeWidth={2.5} />
            </TouchableOpacity>
          )}

          {/* Integrated Filter Button */}
          <TouchableOpacity
            style={styles.filterBtnInside}
            onPress={() => {
              if (onFilterPress) {
                onFilterPress();
              } else {
                setShowDistrictsBar(!showDistrictsBar);
              }
            }}
            activeOpacity={0.8}
          >
            <SlidersHorizontal size={18} color="#0F172A" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* Optional Quick District Chips Row */}
        {showFilterBar && showDistrictsBar && (
          <View style={styles.subBarContainer}>
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
                onPress={handleRecenter}
                activeOpacity={0.8}
              >
                {isLocatingUser ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Crosshair size={13} color={userLocation ? '#059669' : '#64748B'} strokeWidth={2.4} />
                )}
                <Text style={[styles.placeChipText, userLocation && { color: '#059669', fontWeight: '800' }]}>
                  {userLocation ? '📍 Ma Position' : 'GPS'}
                </Text>
              </TouchableOpacity>

              {POPULAR_PLACES.map((place) => {
                const isActive = selectedPlaceId === place.id;
                const placeLabel = language === 'fr' ? place.nameFr : language === 'ar' ? ((place as any).nameAr || place.name) : place.name;
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
          </View>
        )}
      </View>

      {/* ── FLOATING MAP CONTROLS (Right Side) ────────────────────────── */}
      <View
        style={[
          styles.floatingControls,
          { top: (insets.top > 0 ? insets.top + 70 : 80) + (showDistrictsBar ? 48 : 0) },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn} activeOpacity={0.8}>
          <Plus size={18} color="#0F172A" strokeWidth={2.4} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut} activeOpacity={0.8}>
          <Minus size={18} color="#0F172A" strokeWidth={2.4} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMapType} activeOpacity={0.8}>
          <Layers size={17} color="#0F172A" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleRecenter} activeOpacity={0.8}>
          <Navigation size={17} color="#059669" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM PREVIEW CARD (Selected Property) ───────────────────── */}
      {selectedProperty && !hideBottomCard && (
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
          pointerEvents="box-none"
        >
          <View style={styles.bottomCard} pointerEvents="auto">
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
                <Image
                  source={{ uri: selectedProperty.images[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600' }}
                  style={styles.cardThumb}
                />
                <View style={styles.cardStatusBadge}>
                  <Text style={styles.cardStatusBadgeText}>
                    {selectedProperty.status === 'sale' ? 'VENTE' : 'LOCATION'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.cardDetails}>
                <View style={styles.cardPriceRow}>
                  <Text style={styles.cardPrice}>
                    {formatPriceFull(selectedProperty.price, 'FCFA')}
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
                  <Text style={styles.cardLocText} numberOfLines={1}>
                    {selectedProperty.location.district}, {selectedProperty.location.city}
                  </Text>
                </View>

                {/* Distance Badge */}
                {userLocation && (
                  <View style={styles.distanceBadgeRow}>
                    <Route size={11} color="#059669" />
                    <Text style={styles.distanceBadgeText}>
                      À {calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude)} km (~{estimateDriveTimeMin(calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude))} min)
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

            {/* Action Buttons: Itinéraire + WhatsApp + Voir l'annonce */}
            <View style={styles.cardActionGrid}>
              <TouchableOpacity
                style={styles.gmapsNavBtn}
                onPress={() => openGoogleMapsDirection(selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude)}
                activeOpacity={0.85}
              >
                <Compass size={14} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.gmapsNavBtnText}>Itinéraire</Text>
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
                <MessageCircle size={14} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewDetailBtn}
                onPress={() => router.push(`/property/${selectedProperty.id}`)}
                activeOpacity={0.85}
              >
                <Eye size={14} color="#059669" strokeWidth={2.4} />
                <Text style={styles.viewDetailBtnText}>Voir l'annonce</Text>
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

  // ── Error Fallback ──────────────────────────────────────────
  errorFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    padding: 24,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    maxWidth: 320,
    width: '100%',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Live User GPS Radar ───────────────────────────────────────
  userRadarWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRadarPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.5)',
  },
  userRadarDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── White Property Price Pill Marker (Exact Match to UI Reference) ───────────
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))',
  },
  markerWrapperActive: {
    transform: [{ scale: 1.15 }],
    zIndex: 9999,
  },
  pricePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePillActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
    shadowColor: '#059669',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  pricePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  pricePillTextActive: {
    color: '#FFFFFF',
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    alignSelf: 'center',
    marginTop: -1,
  },
  markerPointerActive: {
    borderTopColor: '#059669',
  },

  // ── Floating Top Search Card (Exact Match to Screenshot) ───────
  topFloatingHeader: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 100,
    gap: 8,
  },
  searchBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  searchLeadingBtn: {
    padding: 6,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 8,
    paddingRight: 8,
  },
  clearSearchBtn: {
    padding: 6,
    marginRight: 4,
  },
  filterBtnInside: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  // ── Quick District Chips Row ─────────────────────────────────
  subBarContainer: {
    flexDirection: 'row',
  },
  placeChipsScroll: {
    gap: 7,
    paddingVertical: 2,
  },
  placeChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  placeChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  placeChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  placeChipTextActive: {
    color: '#FFFFFF',
  },
  gpsPlaceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#059669',
  },
  gpsPlaceChipActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: '#059669',
  },

  // ── Floating Controls (Right Side) ───────────────────────────
  floatingControls: {
    position: 'absolute',
    right: 14,
    gap: 8,
    zIndex: 90,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  // ── Bottom Preview Card ──────────────────────────────────────
  bottomCardWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 24,
    zIndex: 99,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
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
    marginBottom: 12,
  },
  cardImageContainer: {
    width: 104,
    height: 104,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  cardThumb: {
    width: '100%',
    height: '100%',
  },
  cardStatusBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 16,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  cardAcdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  cardAcdBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  cardLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cardLocText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  distanceBadgeText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '600',
  },
  cardSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSpecText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // ── Action Grid ──────────────────────────────────────────────
  cardActionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  gmapsNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    borderRadius: 11,
  },
  gmapsNavBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  whatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#25D366',
    paddingVertical: 9,
    borderRadius: 11,
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  viewDetailBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 9,
    borderRadius: 11,
  },
  viewDetailBtnText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
