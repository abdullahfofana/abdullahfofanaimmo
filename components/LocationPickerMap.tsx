import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { MapPin, Crosshair } from 'lucide-react-native';

interface LocationPickerMapProps {
  initialCoordinates?: { latitude: number; longitude: number };
  onLocationSelect: (coords: { latitude: number; longitude: number; commune?: string }) => void;
  height?: number;
}

export default function LocationPickerMap({
  initialCoordinates = { latitude: 5.359952, longitude: -4.008256 },
  onLocationSelect,
  height = 240,
}: LocationPickerMapProps) {
  const [coords, setCoords] = useState(initialCoordinates);

  const communes = [
    { name: 'Cocody', lat: 5.3599, lng: -4.0083 },
    { name: 'Plateau', lat: 5.3247, lng: -4.0127 },
    { name: 'Marcory / Zone 4', lat: 5.2892, lng: -3.9847 },
    { name: 'Deux Plateaux', lat: 5.3650, lng: -4.0180 },
    { name: 'Riviera 3 & 4', lat: 5.3780, lng: -3.9720 },
    { name: 'Yopougon', lat: 5.3400, lng: -4.0800 },
    { name: 'Bingerville', lat: 5.3560, lng: -3.8890 },
    { name: 'Grand-Bassam', lat: 5.2050, lng: -3.7380 },
  ];

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.headerRow}>
        <MapPin size={16} color="#059669" />
        <Text style={styles.headerTitle}>Sélectionnez la commune ou position GPS</Text>
      </View>
      <View style={styles.communesGrid}>
        {communes.map((c) => {
          const isSelected = coords.latitude === c.lat && coords.longitude === c.lng;
          return (
            <TouchableOpacity
              key={c.name}
              style={[styles.communePill, isSelected && styles.communePillActive]}
              onPress={() => {
                const newCoords = { latitude: c.lat, longitude: c.lng, commune: c.name };
                setCoords(newCoords);
                onLocationSelect(newCoords);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.communeText, isSelected && styles.communeTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.badgeRow}>
        <Text style={styles.badgeText}>
          📍 Coordonnées: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  communesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  communePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  communePillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  communeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  communeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badgeRow: {
    alignItems: 'flex-start',
    marginTop: 10,
  },
  badgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
