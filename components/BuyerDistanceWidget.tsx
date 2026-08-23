import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Navigation,
  Car,
  Footprints,
  Crosshair,
  MapPin,
  ExternalLink,
  Route,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import {
  calculateBuyerSellerDistance,
  BuyerSellerDistanceInfo,
  POPULAR_STARTING_POINTS,
  openGoogleMapsDirections,
} from '@/utils/distanceRouting';
import { useLanguage } from '@/providers/LanguageProvider';

interface BuyerDistanceWidgetProps {
  propertyLat: number;
  propertyLng: number;
  propertyTitle: string;
  propertyDistrict: string;
  propertyCity: string;
}

export default function BuyerDistanceWidget({
  propertyLat,
  propertyLng,
  propertyTitle,
  propertyDistrict,
  propertyCity,
}: BuyerDistanceWidgetProps) {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [origin, setOrigin] = useState<{
    id: string;
    label: string;
    lat: number;
    lng: number;
    isGPS: boolean;
  }>({
    id: 'gps',
    label: isFr ? 'Ma position GPS actuelle' : 'My current GPS location',
    lat: 5.3450,
    lng: -4.0125,
    isGPS: true,
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [distanceInfo, setDistanceInfo] = useState<BuyerSellerDistanceInfo | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);

  // Request GPS position
  const requestGPSLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setOrigin({
                id: 'gps',
                label: isFr ? 'Ma position GPS actuelle' : 'My current GPS location',
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                isGPS: true,
              });
              setIsLocating(false);
            },
            (err) => {
              console.warn('[Distance Geolocation] Fallback:', err);
              setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 6000 }
          );
        } else {
          setIsLocating(false);
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setOrigin({
            id: 'gps',
            label: isFr ? 'Ma position GPS actuelle' : 'My current GPS location',
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            isGPS: true,
          });
        }
        setIsLocating(false);
      }
    } catch (e) {
      console.warn('[Distance Widget] GPS Error:', e);
      setIsLocating(false);
    }
  }, [isFr]);

  useEffect(() => {
    requestGPSLocation();
  }, [requestGPSLocation]);

  // Recalculate distance whenever origin changes
  useEffect(() => {
    let isMounted = true;
    calculateBuyerSellerDistance(
      origin.lat,
      origin.lng,
      propertyLat,
      propertyLng,
      origin.label,
      `${propertyDistrict}, ${propertyCity}`
    ).then((info) => {
      if (isMounted) setDistanceInfo(info);
    });
    return () => {
      isMounted = false;
    };
  }, [origin, propertyLat, propertyLng, propertyDistrict, propertyCity]);

  const handleSelectStartingPoint = (point: typeof POPULAR_STARTING_POINTS[0]) => {
    setOrigin({
      id: point.id,
      label: point.name,
      lat: point.lat,
      lng: point.lng,
      isGPS: false,
    });
    setShowLocationPicker(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Route size={18} color="#2563EB" strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {isFr ? 'Distance & Temps de Trajet' : 'Distance & Travel Time'}
            </Text>
            <Text style={styles.subtitle}>
              {isFr
                ? 'Calcul d\'itinéraire entre vous et le vendeur'
                : 'Route calculation between you and the property'}
            </Text>
          </View>
        </View>
      </View>

      {/* Starting Location Selector */}
      <View style={styles.startingPointSelector}>
        <Text style={styles.startingPointLabel}>
          {isFr ? 'Point de départ :' : 'Starting from:'}
        </Text>
        <TouchableOpacity
          style={styles.locationDropdownBtn}
          onPress={() => setShowLocationPicker(!showLocationPicker)}
          activeOpacity={0.8}
        >
          <MapPin size={15} color="#2563EB" />
          <Text style={styles.locationDropdownText} numberOfLines={1}>
            {origin.label}
          </Text>
          {isLocating ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <ChevronDown size={16} color="#64748B" />
          )}
        </TouchableOpacity>
      </View>

      {/* Location Dropdown Options */}
      {showLocationPicker && (
        <View style={styles.dropdownCard}>
          <TouchableOpacity
            style={[styles.dropdownItem, origin.isGPS && styles.dropdownItemActive]}
            onPress={() => {
              requestGPSLocation();
              setShowLocationPicker(false);
            }}
            activeOpacity={0.8}
          >
            <Crosshair size={14} color="#059669" />
            <Text style={[styles.dropdownItemText, origin.isGPS && { color: '#059669', fontWeight: '800' }]}>
              📍 {isFr ? 'Utiliser ma position GPS exacte' : 'Use my exact GPS location'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dropdownSectionHeader}>
            {isFr ? 'Ou choisir un point de référence à Abidjan :' : 'Or select a landmark in Abidjan:'}
          </Text>

          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {POPULAR_STARTING_POINTS.map((pt) => (
              <TouchableOpacity
                key={pt.id}
                style={[styles.dropdownItem, origin.id === pt.id && styles.dropdownItemActive]}
                onPress={() => handleSelectStartingPoint(pt)}
                activeOpacity={0.8}
              >
                <MapPin size={14} color="#64748B" />
                <Text style={styles.dropdownItemText} numberOfLines={1}>
                  {pt.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Results Grid */}
      {distanceInfo && (
        <View style={styles.resultsContainer}>
          {/* Main Statement */}
          <View style={styles.mainStatementBox}>
            <View style={styles.distanceBadgeLarge}>
              <Text style={styles.distanceNumber}>
                {distanceInfo.driving.distanceFormatted}
              </Text>
              <Text style={styles.distanceNumberLabel}>
                {isFr ? 'du bien' : 'from property'}
              </Text>
            </View>

            <View style={styles.travelTimesCol}>
              <View style={styles.timeItem}>
                <View style={styles.timeIconWrap}>
                  <Car size={16} color="#059669" />
                </View>
                <View>
                  <Text style={styles.timeValue}>
                    ~{distanceInfo.driving.durationFormatted}
                  </Text>
                  <Text style={styles.timeLabel}>
                    {isFr ? 'en voiture / taxi' : 'by car / taxi'}
                  </Text>
                </View>
              </View>

              <View style={styles.timeItem}>
                <View style={[styles.timeIconWrap, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                  <Footprints size={16} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.timeValue}>
                    ~{distanceInfo.walking.durationFormatted}
                  </Text>
                  <Text style={styles.timeLabel}>
                    {isFr ? 'à pied' : 'walking'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Google Maps Directions Action Button */}
          <TouchableOpacity
            style={styles.gmapsButton}
            onPress={() => openGoogleMapsDirections(propertyLat, propertyLng, origin.lat, origin.lng)}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#0F172A', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gmapsButtonGradient}
            >
              <Navigation size={17} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.gmapsButtonText}>
                {isFr ? 'Ouvrir l\'Itinéraire dans Google Maps' : 'Open Directions in Google Maps'}
              </Text>
              <ExternalLink size={15} color="#94A3B8" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    marginVertical: 12,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Starting location
  startingPointSelector: {
    marginBottom: 10,
  },
  startingPointLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  locationDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  locationDropdownText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Dropdown card
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownSectionHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  dropdownItemText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
  },

  // Results box
  resultsContainer: {
    gap: 12,
  },
  mainStatementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  distanceBadgeLarge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  distanceNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.5,
  },
  distanceNumberLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  travelTimesCol: {
    flex: 1,
    gap: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  timeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Google Maps Button
  gmapsButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  gmapsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  gmapsButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
