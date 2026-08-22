import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import {
  MapPin,
  X,
  ChevronRight,
  Bed,
  Bath,
  Maximize2,
  Sparkles,
  ExternalLink,
} from 'lucide-react-native';

import { Property } from '@/types/property';
import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';

interface PropertyMapProps {
  properties: Property[];
  initialSelectedId?: string;
}

const POPULAR_PLACES = [
  { id: 'all', name: 'All Abidjan', nameFr: 'Tout Abidjan', lat: 5.359952, lng: -4.008256, zoom: 12 },
  { id: 'cocody', name: 'Cocody', nameFr: 'Cocody', lat: 5.3599, lng: -4.0083, zoom: 14 },
  { id: 'plateau', name: 'Plateau', nameFr: 'Plateau', lat: 5.3247, lng: -4.0127, zoom: 15 },
  { id: 'marcory', name: 'Marcory / Zone 4', nameFr: 'Marcory / Zone 4', lat: 5.2892, lng: -3.9847, zoom: 14 },
  { id: 'riviera', name: 'Riviera / Angré', nameFr: 'Riviera / Angré', lat: 5.3850, lng: -3.9750, zoom: 14 },
  { id: 'yopougon', name: 'Yopougon', nameFr: 'Yopougon', lat: 5.3400, lng: -4.0800, zoom: 13 },
  { id: 'bingerville', name: 'Bingerville', nameFr: 'Bingerville', lat: 5.3560, lng: -3.8890, zoom: 14 },
  { id: 'bassam', name: 'Grand-Bassam', nameFr: 'Grand-Bassam', lat: 5.2050, lng: -3.7380, zoom: 13 },
  { id: 'assinie', name: 'Assinie', nameFr: 'Assinie', lat: 5.1320, lng: -3.2840, zoom: 12 },
];

export default function PropertyMap({ properties, initialSelectedId }: PropertyMapProps) {
  const colors = useColors();
  const { language } = useLanguage();

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(initialSelectedId || null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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

  const formatPriceFull = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} Mrd FCFA`;
      return `${(price / 1_000_000).toFixed(1)}M FCFA`;
    }
    return `${price.toLocaleString()} ${currency}`;
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
      const match = validProperties.find(
        (p) =>
          p.location.district.toLowerCase().includes(place.id.toLowerCase()) ||
          p.location.city.toLowerCase().includes(place.id.toLowerCase())
      );
      if (match) setSelectedPropertyId(match.id);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SELECT_PROPERTY') {
        setSelectedPropertyId(event.data.propertyId);
      } else if (event.data && event.data.type === 'OPEN_PROPERTY') {
        router.push(`/property/${event.data.propertyId}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Generate Leaflet HTML for web embedding
  const mapHtml = useMemo(() => {
    const propertiesJson = JSON.stringify(
      validProperties.map((p) => ({
        id: p.id,
        title: p.title,
        price: formatPriceFull(p.price, p.currency),
        priceBadge: p.price >= 1000000 ? `${(p.price / 1000000).toFixed(0)}M` : `${(p.price / 1000).toFixed(0)}k`,
        status: p.status,
        image: p.images[0],
        district: p.location.district,
        city: p.location.city,
        lat: p.location.coordinates.latitude,
        lng: p.location.coordinates.longitude,
      }))
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #e5e7eb; }
    .price-pin {
      background: #1B3A2D;
      color: #ffffff;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      cursor: pointer;
      white-space: nowrap;
      text-align: center;
      transition: transform 0.2s, background-color 0.2s;
    }
    .price-pin:hover, .price-pin.active {
      transform: scale(1.15);
      background: #C9933A;
      z-index: 1000 !important;
    }
    .price-pin.rent {
      background: #1D4ED8;
    }
    .price-pin.rent:hover, .price-pin.rent.active {
      background: #C9933A;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.18);
    }
    .leaflet-popup-content {
      margin: 0;
      width: 220px !important;
    }
    .popup-img {
      width: 100%;
      height: 110px;
      object-fit: cover;
    }
    .popup-body {
      padding: 10px 12px;
    }
    .popup-price {
      font-size: 14px;
      font-weight: 800;
      color: #1B3A2D;
      margin-bottom: 2px;
    }
    .popup-title {
      font-size: 12px;
      font-weight: 600;
      color: #18211C;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .popup-loc {
      font-size: 10px;
      color: #6B7F72;
      margin-bottom: 8px;
    }
    .popup-btn {
      display: block;
      width: 100%;
      padding: 6px 0;
      background: #1B3A2D;
      color: #ffffff;
      text-align: center;
      border-radius: 8px;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const properties = ${propertiesJson};
    const map = L.map('map', { zoomControl: false }).setView([5.359952, -4.008256], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; CartoDB &copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const markers = {};

    properties.forEach(p => {
      const isRent = p.status === 'rent';
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="price-pin ' + (isRent ? 'rent' : 'sale') + '" id="pin-' + p.id + '">' + p.priceBadge + '</div>',
        iconSize: [46, 26],
        iconAnchor: [23, 13]
      });

      const popupContent = '<div style="cursor:pointer;" onclick="window.parent.postMessage({type: \\'OPEN_PROPERTY\\', propertyId: \\'' + p.id + '\\'}, \\'*\\')">' +
        '<img src="' + p.image + '" class="popup-img" />' +
        '<div class="popup-body">' +
          '<div class="popup-price">' + p.price + '</div>' +
          '<div class="popup-title">' + p.title + '</div>' +
          '<div class="popup-loc">📍 ' + p.district + ', ' + p.city + '</div>' +
          '<a class="popup-btn">Voir détails →</a>' +
        '</div>' +
      '</div>';

      const marker = L.marker([p.lat, p.lng], { icon: icon })
        .addTo(map)
        .bindPopup(popupContent, { offset: [0, -10] });

      marker.on('click', () => {
        window.parent.postMessage({ type: 'SELECT_PROPERTY', propertyId: p.id }, '*');
      });

      markers[p.id] = marker;
    });

    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'PAN_TO') {
        map.flyTo([e.data.lat, e.data.lng], e.data.zoom, { duration: 1.2 });
      } else if (e.data && e.data.type === 'HIGHLIGHT') {
        if (markers[e.data.propertyId]) {
          markers[e.data.propertyId].openPopup();
        }
      }
    });
  </script>
</body>
</html>`;
  }, [validProperties]);

  return (
    <View style={styles.container}>
      {/* ── TOP PLACES HORIZONTAL PILL BAR ───────────────────────── */}
      <View style={styles.topBarContainer}>
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

      {/* ── INTERACTIVE WEB MAP IFRAME ──────────────────────────── */}
      {Platform.OS === 'web' ? (
        // @ts-ignore
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 16,
          }}
          title="Interactive Property Map"
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <MapPin size={36} color={colors.primary} />
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            {validProperties.length} Properties in Ivory Coast
          </Text>
        </View>
      )}

      {/* ── FLOATING BOTTOM PROPERTY PREVIEW CARD ────────────────── */}
      {selectedProperty && (
        <View style={styles.bottomCardWrapper}>
          <View style={[styles.propertyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    minHeight: 450,
    backgroundColor: '#E5E7EB',
  },
  topBarContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  placeChipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
    paddingVertical: 4,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  placeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomCardWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    zIndex: 30,
  },
  propertyCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: 'rgba(10,25,18,0.22)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
    position: 'relative',
  },
  closeCardBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
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
    width: 95,
    height: 95,
    borderRadius: 12,
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
    fontSize: 13,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
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
    paddingHorizontal: 5,
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
    borderRadius: 8,
  },
  detailActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

