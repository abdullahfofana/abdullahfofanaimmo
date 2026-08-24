import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  MapPin,
  X,
  Search,
  Check,
  Crosshair,
  Compass,
  Building,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { searchLocationSuggestions, reverseGeocodeCoordinates, GeocodedLocation } from '@/services/googleMapsService';
import { useLanguage } from '@/providers/LanguageProvider';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: {
    address: string;
    district: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }) => void;
  initialLocation?: {
    address?: string;
    district?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export default function LocationPickerModal({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: initialLocation?.coordinates?.latitude || 5.3599,
    longitude: initialLocation?.coordinates?.longitude || -4.0083,
  });

  const [selectedAddress, setSelectedAddress] = useState(
    initialLocation?.address || 'Cocody, Abidjan'
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    initialLocation?.district || 'Cocody'
  );
  const [selectedCity, setSelectedCity] = useState(
    initialLocation?.city || 'Abidjan'
  );

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Sync initial location when opening
  useEffect(() => {
    if (visible && initialLocation?.coordinates) {
      setCurrentCoords(initialLocation.coordinates);
      if (initialLocation.address) setSelectedAddress(initialLocation.address);
      if (initialLocation.district) setSelectedDistrict(initialLocation.district);
      if (initialLocation.city) setSelectedCity(initialLocation.city);
    }
  }, [visible, initialLocation]);

  // Search autocomplete
  const handleSearchChange = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      setIsSearching(true);
      const results = await searchLocationSuggestions(text);
      setSuggestions(results);
      setIsSearching(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: GeocodedLocation) => {
    setCurrentCoords({ latitude: item.latitude, longitude: item.longitude });
    setSelectedAddress(item.address);
    setSelectedDistrict(item.district);
    setSelectedCity(item.city);
    setSearchQuery('');
    setSuggestions([]);

    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_PIN', lat: item.latitude, lng: item.longitude, zoom: 15 },
        '*'
      );
    }
  };

  // Locate current GPS
  const handleLocateMe = async () => {
    setIsReverseGeocoding(true);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCurrentCoords({ latitude: lat, longitude: lng });

            const rev = await reverseGeocodeCoordinates(lat, lng);
            setSelectedAddress(rev.address);
            setSelectedDistrict(rev.district);
            setSelectedCity(rev.city);
            setIsReverseGeocoding(false);

            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                { type: 'SET_PIN', lat, lng, zoom: 16 },
                '*'
              );
            }
          },
          () => setIsReverseGeocoding(false),
          { enableHighAccuracy: true, timeout: 7000 }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;
          setCurrentCoords({ latitude: lat, longitude: lng });

          const rev = await reverseGeocodeCoordinates(lat, lng);
          setSelectedAddress(rev.address);
          setSelectedDistrict(rev.district);
          setSelectedCity(rev.city);
        }
        setIsReverseGeocoding(false);
      }
    } catch (e) {
      console.warn('[Location Picker GPS]', e);
      setIsReverseGeocoding(false);
    }
  };

  // Receive PIN drag/click events from map
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'MAP_CLICKED_COORDS') {
        const { lat, lng } = event.data;
        setCurrentCoords({ latitude: lat, longitude: lng });
        setIsReverseGeocoding(true);
        const rev = await reverseGeocodeCoordinates(lat, lng);
        setSelectedAddress(rev.address);
        setSelectedDistrict(rev.district);
        setSelectedCity(rev.city);
        setIsReverseGeocoding(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConfirmLocation = () => {
    onConfirm({
      address: selectedAddress,
      district: selectedDistrict,
      city: selectedCity,
      coordinates: currentCoords,
    });
    onClose();
  };

  // Leaflet Pin-Drop Map HTML
  const pickerMapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .draggable-pin {
      width: 32px;
      height: 32px;
      background: #059669;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 6px 16px rgba(5, 150, 105, 0.5);
      cursor: grab;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([${currentCoords.latitude}, ${currentCoords.longitude}], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; CartoDB &copy; OpenStreetMap'
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: '<div class="draggable-pin"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    let marker = L.marker([${currentCoords.latitude}, ${currentCoords.longitude}], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    marker.on('dragend', function(e) {
      const pos = e.target.getLatLng();
      window.parent.postMessage({ type: 'MAP_CLICKED_COORDS', lat: pos.lat, lng: pos.lng }, '*');
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      window.parent.postMessage({ type: 'MAP_CLICKED_COORDS', lat: e.latlng.lat, lng: e.latlng.lng }, '*');
    });

    window.addEventListener('message', function(event) {
      if (!event.data) return;
      if (event.data.type === 'SET_PIN') {
        const latLng = [event.data.lat, event.data.lng];
        marker.setLatLng(latLng);
        map.setView(latLng, event.data.zoom || 15);
      }
    });
  </script>
</body>
</html>`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>
              {isFr ? 'Sélectionner l\'emplacement sur la carte' : 'Select Location on Map'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isFr
                ? 'Déplacez le curseur vert ou recherchez une adresse exacte'
                : 'Move the green pin or search for an exact address'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <X size={20} color="#64748B" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Search & GPS Bar */}
        <View style={styles.searchBarWrap}>
          <View style={styles.searchInputRow}>
            <Search size={17} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder={isFr ? 'Rechercher un quartier (ex: Riviera 3, Cocody)...' : 'Search area or address...'}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor="#94A3B8"
            />
            {isSearching && <ActivityIndicator size="small" color="#059669" />}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.gpsBtn} onPress={handleLocateMe} activeOpacity={0.8}>
            <Crosshair size={18} color="#059669" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Search Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsList}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.8}
              >
                <MapPin size={15} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionTitle}>{item.address}</Text>
                  <Text style={styles.suggestionSub}>{item.formattedAddress}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Map View Area */}
        <View style={styles.mapArea}>
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <iframe
              ref={iframeRef}
              srcDoc={pickerMapHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Location Picker Map"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text>Map Picker...</Text>
            </View>
          )}
        </View>

        {/* Bottom Confirmation Bar */}
        <View style={[styles.bottomConfirmBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.confirmedLocationRow}>
            <View style={styles.pinCircle}>
              <MapPin size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.confirmedAddress} numberOfLines={1}>
                {selectedAddress}
              </Text>
              <Text style={styles.confirmedDistrict}>
                📍 {selectedDistrict}, {selectedCity} · ({currentCoords.latitude.toFixed(4)}, {currentCoords.longitude.toFixed(4)})
              </Text>
            </View>
            {isReverseGeocoding && <ActivityIndicator size="small" color="#059669" />}
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmLocation}
            activeOpacity={0.88}
          >
            <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.confirmBtnText}>
              {isFr ? 'Valider cette position géographique' : 'Confirm Property Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search Bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 10,
  },
  searchInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  gpsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease',
      },
    }),
  },

  // Suggestions
  suggestionsList: {
    position: 'absolute',
    top: 110,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    zIndex: 99,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
    maxHeight: 220,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        transition: 'background-color 0.15s ease',
      },
    }),
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  suggestionSub: {
    fontSize: 11,
    color: '#64748B',
  },

  // Map
  mapArea: {
    flex: 1,
  },

  // Bottom Confirm
  bottomConfirmBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  confirmedLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedAddress: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  confirmedDistrict: {
    fontSize: 11.5,
    color: '#64748B',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#059669',
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
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
