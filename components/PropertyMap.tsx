import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  MapPin,
  Navigation,
  Crosshair,
  X,
  Bed,
  Bath,
  Maximize2,
  Sparkles,
  ExternalLink,
  Phone,
  MessageCircle,
  Route,
  Compass,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Eye,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  { id: 'all', name: 'All Abidjan', nameFr: 'Tout Abidjan', lat: 5.359952, lng: -4.008256, zoom: 12 },
  { id: 'cocody', name: 'Cocody', nameFr: 'Cocody', lat: 5.3599, lng: -4.0083, zoom: 14 },
  { id: 'riviera', name: 'Riviera 3 & 4', nameFr: 'Riviera 3 & 4', lat: 5.3780, lng: -3.9720, zoom: 14 },
  { id: 'plateau', name: 'Plateau', nameFr: 'Plateau', lat: 5.3247, lng: -4.0127, zoom: 15 },
  { id: 'marcory', name: 'Marcory / Zone 4', nameFr: 'Marcory / Zone 4', lat: 5.2892, lng: -3.9847, zoom: 14 },
  { id: 'deux_plateaux', name: '2 Plateaux', nameFr: '2 Plateaux', lat: 5.3650, lng: -4.0180, zoom: 14 },
  { id: 'angre', name: 'Angré', nameFr: 'Angré', lat: 5.4050, lng: -3.9890, zoom: 14 },
  { id: 'yopougon', name: 'Yopougon', nameFr: 'Yopougon', lat: 5.3400, lng: -4.0800, zoom: 13 },
  { id: 'bingerville', name: 'Bingerville', nameFr: 'Bingerville', lat: 5.3560, lng: -3.8890, zoom: 14 },
  { id: 'bassam', name: 'Grand-Bassam', nameFr: 'Grand-Bassam', lat: 5.2050, lng: -3.7380, zoom: 13 },
  { id: 'assinie', name: 'Assinie', nameFr: 'Assinie', lat: 5.1320, lng: -3.2840, zoom: 12 },
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
  return Math.max(1, Math.round((distanceKm / 28) * 60)); // Average ~28km/h in Abidjan traffic
}

export default function PropertyMap({ properties, initialSelectedId }: PropertyMapProps) {
  const colors = useColors();
  const { language, t } = useLanguage();

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(initialSelectedId || null);
  const [selectedRadiusId, setSelectedRadiusId] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

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

  // Request User GPS Location
  const requestUserLocation = useCallback(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsLocatingUser(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocatingUser(false);
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserLocation(coords);

          // Pan Leaflet map to buyer location
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'SET_USER_LOCATION',
                lat: coords.latitude,
                lng: coords.longitude,
              },
              '*'
            );
          }
        },
        (err) => {
          console.warn('[Map Geolocation] User position unavailable:', err.message);
          setIsLocatingUser(false);
          // Default to Plateau / Cocody center for Abidjan demo
          const fallback = { latitude: 5.3485, longitude: -4.0125 };
          setUserLocation(fallback);
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'SET_USER_LOCATION',
                lat: fallback.latitude,
                lng: fallback.longitude,
              },
              '*'
            );
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  // Auto request location on load
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
    return filteredProperties.find((p) => p.id === selectedPropertyId) || null;
  }, [filteredProperties, selectedPropertyId]);

  // Animate preview card when a property is selected
  useEffect(() => {
    if (selectedProperty) {
      Animated.spring(cardAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedProperty, cardAnim]);

  const formatPriceFull = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} Mrd FCFA`;
      return `${(price / 1_000_000).toFixed(1)}M FCFA`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  const formatPricePill = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} Mrd`;
      if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
      if (price >= 1_000) return `${(price / 1_000).toFixed(0)}k`;
      return `${price}`;
    }
    return `${price.toLocaleString()}`;
  };

  const handlePlaceSelect = (place: typeof POPULAR_PLACES[0]) => {
    setSelectedPlaceId(place.id);
    if (Platform.OS === 'web' && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'PAN_TO', lat: place.lat, lng: place.lng, zoom: place.zoom },
        '*'
      );
    }
    if (place.id !== 'all') {
      const match = filteredProperties.find(
        (p) =>
          p.location.district.toLowerCase().includes(place.id.toLowerCase()) ||
          p.location.city.toLowerCase().includes(place.id.toLowerCase())
      );
      if (match) setSelectedPropertyId(match.id);
    }
  };

  const openGoogleMapsDirection = (propLat: number, propLng: number) => {
    let url = `https://www.google.com/maps/dir/?api=1&destination=${propLat},${propLng}&travelmode=driving`;
    if (userLocation) {
      url += `&origin=${userLocation.latitude},${userLocation.longitude}`;
    }
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
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

  const handleCallContact = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  // Message listener from Leaflet iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SELECT_PROPERTY') {
        setSelectedPropertyId(event.data.propertyId);
      } else if (event.data && event.data.type === 'OPEN_PROPERTY') {
        router.push(`/property/${event.data.propertyId}`);
      } else if (event.data && event.data.type === 'OPEN_GOOGLE_MAPS') {
        openGoogleMapsDirection(event.data.lat, event.data.lng);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [userLocation]);

  // Generate Leaflet HTML for web embedding matching user's exact reference style
  const mapHtml = useMemo(() => {
    const propertiesData = filteredProperties.map((p) => {
      const dist = userLocation
        ? calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            p.location.coordinates.latitude,
            p.location.coordinates.longitude
          )
        : null;
      const driveTime = dist ? estimateDriveTimeMin(dist) : null;

      return {
        id: p.id,
        title: p.title,
        price: formatPriceFull(p.price, p.currency),
        priceBadge: formatPricePill(p.price, p.currency),
        status: p.status,
        isFeatured: p.isFeatured || p.price > 100000000,
        image: p.images[0],
        district: p.location.district,
        city: p.location.city,
        lat: p.location.coordinates.latitude,
        lng: p.location.coordinates.longitude,
        bedrooms: p.bedrooms || 0,
        bathrooms: p.bathrooms || 0,
        area: p.area || 0,
        distanceKm: dist,
        driveTimeMin: driveTime,
        phone: p.agent.phone,
      };
    });

    const userLat = userLocation?.latitude || 5.3485;
    const userLng = userLocation?.longitude || -4.0125;
    const hasUserLoc = !!userLocation;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #e5e7eb; }
    
    /* Emerald Price Bubble Marker (Matches user reference image exactly) */
    .price-marker-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.22));
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .price-marker-wrap:hover, .price-marker-wrap.active {
      transform: scale(1.18);
      z-index: 9999 !important;
    }
    .price-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #059669;
      color: #ffffff;
      padding: 5px 9px;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 800;
      white-space: nowrap;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.4);
      letter-spacing: -0.2px;
    }
    .price-bubble.featured {
      background: #047857;
      border-color: #FCD34D;
      box-shadow: 0 0 10px rgba(252, 211, 77, 0.6);
    }
    .price-bubble.rent {
      background: #0d9488;
    }
    .price-marker-wrap.active .price-bubble {
      background: #064e3b;
      border-color: #F59E0B;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.75);
    }
    .price-tail {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid #059669;
      margin-top: -1px;
    }
    .price-bubble.featured + .price-tail {
      border-top-color: #047857;
    }
    .price-marker-wrap.active .price-tail {
      border-top-color: #064e3b;
    }

    /* Buyer Live GPS Radar Marker */
    .buyer-radar-marker {
      position: relative;
      width: 24px;
      height: 24px;
    }
    .buyer-dot {
      width: 14px;
      height: 14px;
      background: #2563EB;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      position: absolute;
      top: 5px;
      left: 5px;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.5);
    }
    .buyer-pulse {
      width: 24px;
      height: 24px;
      background: rgba(37, 99, 235, 0.35);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* Popup Styling */
    .leaflet-popup-content-wrapper {
      border-radius: 18px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.22);
      border: 1px solid rgba(226, 232, 240, 0.9);
    }
    .leaflet-popup-content {
      margin: 0;
      width: 250px !important;
    }
    .popup-cover {
      width: 100%;
      height: 120px;
      object-fit: cover;
    }
    .popup-body {
      padding: 12px 14px;
      background: #FFFFFF;
    }
    .popup-price {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 2px;
    }
    .popup-title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .popup-dist-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(5, 150, 105, 0.1);
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 7px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .popup-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
    }
    .gmaps-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #0F172A;
      color: #FFFFFF;
      text-decoration: none;
      padding: 7px 10px;
      border-radius: 9px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .detail-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #059669;
      color: #FFFFFF;
      text-decoration: none;
      padding: 7px 10px;
      border-radius: 9px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const properties = ${JSON.stringify(propertiesData)};
    let userCoords = ${hasUserLoc ? `{ lat: ${userLat}, lng: ${userLng} }` : 'null'};
    let activeLine = null;

    const map = L.map('map', { zoomControl: false }).setView([5.359952, -4.008256], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; CartoDB &copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const markers = {};
    let userMarker = null;

    function renderUserMarker(lat, lng) {
      if (userMarker) map.removeLayer(userMarker);
      const userIcon = L.divIcon({
        className: 'custom-buyer-icon',
        html: '<div class="buyer-radar-marker"><div class="buyer-pulse"></div><div class="buyer-dot"></div></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 2000 })
        .addTo(map)
        .bindTooltip('📍 Votre Position (Acheteur)', { permanent: false, direction: 'top' });
    }

    if (userCoords) {
      renderUserMarker(userCoords.lat, userCoords.lng);
    }

    properties.forEach(p => {
      const isRent = p.status === 'rent';
      const isFeatured = p.isFeatured;
      const starIcon = isFeatured ? '⭐ ' : '';
      const checkIcon = ' ✔️';

      const iconHtml = '<div class="price-marker-wrap" id="pin-' + p.id + '">' +
        '<div class="price-bubble ' + (isFeatured ? 'featured' : isRent ? 'rent' : '') + '">' +
          starIcon + p.priceBadge + checkIcon +
        '</div>' +
        '<div class="price-tail"></div>' +
      '</div>';

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: [70, 32],
        iconAnchor: [35, 32]
      });

      const distText = p.distanceKm ? '📍 ' + p.distanceKm + ' km de vous (~' + p.driveTimeMin + ' min)' : '📍 ' + p.district + ', ' + p.city;

      const popupContent = '<div style="cursor:default;">' +
        '<img src="' + p.image + '" class="popup-cover" />' +
        '<div class="popup-body">' +
          '<div class="popup-price">' + p.price + '</div>' +
          '<div class="popup-title">' + p.title + '</div>' +
          '<div class="popup-dist-badge">' + distText + '</div>' +
          '<div class="popup-actions">' +
            '<div class="gmaps-btn" onclick="window.parent.postMessage({type: \\'OPEN_GOOGLE_MAPS\\', lat: ' + p.lat + ', lng: ' + p.lng + '}, \\'*\\')">🚗 Itinéraire Google Maps</div>' +
            '<div class="detail-btn" onclick="window.parent.postMessage({type: \\'OPEN_PROPERTY\\', propertyId: \\'' + p.id + '\\'}, \\'*\\')">👁️ Voir l\\'annonce</div>' +
          '</div>' +
        '</div>' +
      '</div>';

      const marker = L.marker([p.lat, p.lng], { icon: icon })
        .addTo(map)
        .bindPopup(popupContent, { offset: [0, -20] });

      marker.on('click', () => {
        // Remove previous active classes
        document.querySelectorAll('.price-marker-wrap').forEach(el => el.classList.remove('active'));
        const el = document.getElementById('pin-' + p.id);
        if (el) el.classList.add('active');

        // Draw connecting line from buyer to property
        if (activeLine) map.removeLayer(activeLine);
        if (userCoords) {
          activeLine = L.polyline([
            [userCoords.lat, userCoords.lng],
            [p.lat, p.lng]
          ], {
            color: '#059669',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.85
          }).addTo(map);
        }

        window.parent.postMessage({ type: 'SELECT_PROPERTY', propertyId: p.id }, '*');
      });

      markers[p.id] = marker;
    });

    window.addEventListener('message', (event) => {
      if (!event.data) return;
      if (event.data.type === 'PAN_TO') {
        map.flyTo([event.data.lat, event.data.lng], event.data.zoom || 13, { duration: 0.8 });
      } else if (event.data.type === 'SET_USER_LOCATION') {
        userCoords = { lat: event.data.lat, lng: event.data.lng };
        renderUserMarker(userCoords.lat, userCoords.lng);
      } else if (event.data.type === 'FOCUS_PROPERTY') {
        const m = markers[event.data.propertyId];
        if (m) {
          map.flyTo(m.getLatLng(), 15, { duration: 0.8 });
          m.openPopup();
        }
      }
    });
  </script>
</body>
</html>`;
  }, [filteredProperties, userLocation]);

  return (
    <View style={styles.container}>
      {/* ── TOP SEARCH & DISTANCE RADIUS BAR ───────────────────────── */}
      <View style={styles.topFilterBar}>
        {/* District pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.placeChipsScroll}
        >
          {/* Live GPS Radar Pill */}
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

        {/* Distance Proximity Filter */}
        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>
            {language === 'fr' ? 'Rayon de distance :' : 'Distance radius:'}
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

      {/* ── MAP CONTAINER ──────────────────────────────────────────── */}
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <iframe
            ref={iframeRef}
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Interactive Real Estate Map Côte d'Ivoire"
          />
        ) : (
          <View style={styles.nativeMapPlaceholder}>
            <Text style={{ color: '#64748B' }}>Carte interactive en chargement...</Text>
          </View>
        )}
      </View>

      {/* ── BOTTOM FLOATING PROPERTY PREVIEW CARD ───────────────────── */}
      {selectedProperty && (
        <Animated.View
          style={[
            styles.bottomCardWrapper,
            {
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
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
              onPress={() => setSelectedPropertyId(null)}
              activeOpacity={0.8}
            >
              <X size={16} color="#64748B" strokeWidth={2.4} />
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

                {/* Live Distance from Buyer */}
                {userLocation && (
                  <View style={styles.distanceBadgeRow}>
                    <Route size={12} color="#059669" />
                    <Text style={styles.distanceBadgeText}>
                      À {calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude)} km de vous (~{estimateDriveTimeMin(calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude))} min en voiture)
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

            {/* Action Buttons: Google Maps Navigation + WhatsApp + Call */}
            <View style={styles.cardActionGrid}>
              <TouchableOpacity
                style={styles.gmapsNavBtn}
                onPress={() => openGoogleMapsDirection(selectedProperty.location.coordinates.latitude, selectedProperty.location.coordinates.longitude)}
                activeOpacity={0.85}
              >
                <Compass size={15} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.gmapsNavBtnText}>Itinéraire Google Maps</Text>
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
                <Text style={styles.viewDetailBtnText}>Voir fiche</Text>
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
    position: 'relative',
  },
  topFilterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  placeChipsScroll: {
    gap: 8,
    alignItems: 'center',
    paddingBottom: 6,
  },
  placeChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  placeChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  placeChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  placeChipTextActive: {
    color: '#FFFFFF',
  },
  gpsPlaceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    gap: 8,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  radiusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusScroll: {
    gap: 6,
  },
  radiusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radiusPillActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: '#059669',
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  radiusPillTextActive: {
    color: '#059669',
    fontWeight: '800',
  },

  // Map wrapper
  mapWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nativeMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Floating Preview Card
  bottomCardWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    maxWidth: 580,
    alignSelf: 'center',
    zIndex: 999,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
  },
  closeCardBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardMainRow: {
    flexDirection: 'row',
    gap: 14,
  },
  cardImageContainer: {
    width: 105,
    height: 105,
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
    bottom: 6,
    left: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  cardStatusBadgeText: {
    fontSize: 9,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardAcdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  cardAcdBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
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
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cardSpecsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardSpecText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },

  // Action buttons inside card
  cardActionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  gmapsNavBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    borderRadius: 12,
  },
  gmapsNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  whatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 12,
  },
  whatsAppBtnText: {
    fontSize: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  viewDetailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
});
