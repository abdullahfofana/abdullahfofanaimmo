import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapPin, Navigation, Crosshair, Plus, Minus, Check, Layers } from 'lucide-react-native';
import * as Location from 'expo-location';

interface LocationPickerMapProps {
  initialCoordinates?: { latitude: number; longitude: number };
  onLocationSelect: (coords: { latitude: number; longitude: number; commune?: string }) => void;
  height?: number;
}

const DEFAULT_ABIDJAN = {
  latitude: 5.359952,
  longitude: -4.008256,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function LocationPickerMapNative({
  initialCoordinates,
  onLocationSelect,
  height = 260,
}: LocationPickerMapProps) {
  const mapRef = useRef<MapView>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number }>(
    initialCoordinates || { latitude: DEFAULT_ABIDJAN.latitude, longitude: DEFAULT_ABIDJAN.longitude }
  );
  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard');

  const handleMapPress = useCallback((e: any) => {
    if (e.nativeEvent && e.nativeEvent.coordinate) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      const coords = { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
      setSelectedCoords(coords);
      onLocationSelect(coords);
    }
  }, [onLocationSelect]);

  const handleMarkerDragEnd = useCallback((e: any) => {
    if (e.nativeEvent && e.nativeEvent.coordinate) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      const coords = { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
      setSelectedCoords(coords);
      onLocationSelect(coords);
    }
  }, [onLocationSelect]);

  const handleUseCurrentGPS = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Activez la localisation GPS pour positionner votre bien automatiquement.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        latitude: Number(loc.coords.latitude.toFixed(6)),
        longitude: Number(loc.coords.longitude.toFixed(6)),
      };
      setSelectedCoords(coords);
      onLocationSelect(coords);

      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 700);
    } catch (error) {
      Alert.alert('GPS', 'Impossible de récupérer votre position actuelle.');
    } finally {
      setIsLocating(false);
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

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: selectedCoords.latitude,
          longitude: selectedCoords.longitude,
          latitudeDelta: DEFAULT_ABIDJAN.latitudeDelta,
          longitudeDelta: DEFAULT_ABIDJAN.longitudeDelta,
        }}
        mapType={mapType}
        onPress={handleMapPress}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        loadingEnabled={true}
      >
        {mapType === 'standard' && (
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            zIndex={-1}
          />
        )}

        <Marker
          coordinate={selectedCoords}
          draggable
          onDragEnd={handleMarkerDragEnd}
          title="Emplacement du bien"
          description="Glissez le marqueur pour ajuster"
        >
          <View style={styles.customMarker}>
            <View style={styles.markerCircle}>
              <MapPin size={18} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View style={styles.markerPointer} />
          </View>
        </Marker>
      </MapView>

      {/* Floating Instructions Pill */}
      <View style={styles.instructionPill} pointerEvents="none">
        <Text style={styles.instructionText}>
          👆 Touchez ou glissez le repère sur la carte
        </Text>
      </View>

      {/* Map Control Buttons */}
      <View style={styles.controlsCol} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleUseCurrentGPS}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            <Crosshair size={18} color="#059669" strokeWidth={2.4} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleZoomIn}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Plus size={18} color="#0F172A" strokeWidth={2.4} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleZoomOut}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Minus size={18} color="#0F172A" strokeWidth={2.4} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setMapType(m => m === 'standard' ? 'hybrid' : 'standard')}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Layers size={16} color="#0F172A" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Coordinate Badge Footer */}
      <View style={styles.coordsFooter} pointerEvents="none">
        <View style={styles.coordsBadge}>
          <Check size={12} color="#059669" strokeWidth={3} />
          <Text style={styles.coordsText}>
            GPS: {selectedCoords.latitude.toFixed(5)}, {selectedCoords.longitude.toFixed(5)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#059669',
    marginTop: -1,
  },
  instructionPill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
  },
  instructionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  controlsCol: {
    position: 'absolute',
    right: 10,
    top: 10,
    gap: 6,
    zIndex: 10,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  coordsFooter: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
});
