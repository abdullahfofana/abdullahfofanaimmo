import React from 'react';
import { StyleSheet, View, Text, Platform, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { Property } from '@/types/property';
import { useColors } from '@/hooks/useColors';
import Typography from '@/constants/typography';
import { router } from 'expo-router';
import { Navigation } from 'lucide-react-native';

interface PropertyMapProps {
  properties: Property[];
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  const colors = useColors();

  // Default region (Abidjan)
  const defaultRegion = {
    latitude: 5.359952,
    longitude: -4.008256,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Filter out properties with invalid coordinates
  const validProperties = properties.filter(
    (p) =>
      p.location?.coordinates?.latitude != null &&
      p.location?.coordinates?.longitude != null &&
      !isNaN(p.location.coordinates.latitude) &&
      !isNaN(p.location.coordinates.longitude)
  );

  // Navigate in-app to the property detail screen (no external redirect)
  const handleCalloutPress = (property: Property) => {
    router.push(`/property/${property.id}`);
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {validProperties.map((property) => (
          <Marker
            key={property.id}
            coordinate={{
              latitude: property.location.coordinates.latitude,
              longitude: property.location.coordinates.longitude,
            }}
            tracksViewChanges={false}
            onCalloutPress={() => handleCalloutPress(property)}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, { backgroundColor: colors.primary, borderColor: colors.white }]}>
                <Text style={[styles.markerText, { color: colors.white }]}>
                  {(property.price / 1000000).toFixed(0)}M
                </Text>
              </View>
              <View style={[styles.markerArrow, { borderTopColor: colors.primary }]} />
            </View>

            <Callout tooltip>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCalloutPress(property)}
              >
                <View style={styles.calloutContainer}>
                  <View style={[styles.calloutContent, { backgroundColor: colors.surface }]}>
                    <Image
                      source={{ uri: property.images[0] }}
                      style={[styles.calloutImage, { backgroundColor: colors.backgroundSecondary }]}
                    />
                    <View style={styles.calloutInfo}>
                      <Text style={[styles.calloutTitle, { color: colors.text }]} numberOfLines={1}>{property.title}</Text>
                      <Text style={[styles.calloutPrice, { color: colors.primary }]}>{(property.price / 1000000).toFixed(1)}M FCFA</Text>
                      <Text style={[styles.calloutType, { color: colors.textSecondary }]}>{property.type}</Text>
                      <View style={styles.calloutActions}>
                        <View style={[styles.actionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40', borderWidth: 1 }]}>
                          <Navigation size={12} color={colors.primary} />
                          <Text style={[styles.actionText, { color: colors.primary }]}>View Details</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.calloutArrow, { borderTopColor: colors.surface }]} />
                </View>
              </TouchableOpacity>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    fontWeight: '700' as const,
    fontSize: 12,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid' as const,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
    alignSelf: 'center' as const,
  },
  calloutContainer: {
    width: 240,
    alignItems: 'center',
    marginBottom: 5,
  },
  calloutContent: {
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  calloutInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  calloutTitle: {
    ...Typography.bodySmall,
    fontWeight: '700' as const,
    fontSize: 13,
  },
  calloutPrice: {
    ...Typography.caption,
    fontWeight: '700' as const,
  },
  calloutType: {
    ...Typography.caption,
    textTransform: 'capitalize' as const,
  },
  calloutActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  calloutArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid' as const,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
