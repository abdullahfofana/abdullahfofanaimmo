import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Property } from '@/types/property';
import { useColors } from '@/hooks/useColors';
import Typography from '@/constants/typography';
import { MapPin } from 'lucide-react-native';

interface PropertyMapProps {
  properties: Property[];
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  const colors = useColors();
  
  return (
    <View style={[styles.webContainer, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.webContent}>
        <View style={[styles.webIcon, { backgroundColor: colors.primary + '1A' }]}>
          <MapPin size={48} color={colors.primary} />
        </View>
        <Text style={[styles.webTitle, { color: colors.text }]}>Interactive Map</Text>
        <Text style={[styles.webDescription, { color: colors.textSecondary }]}>
          The interactive map view is optimized for the mobile application. 
          Please switch to the mobile app to explore properties on the map.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    minHeight: 400,
  },
  webContent: {
    alignItems: 'center',
    padding: 32,
    maxWidth: 400,
  },
  webIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  webTitle: {
    ...Typography.h3,
    marginBottom: 8,
    textAlign: 'center',
  },
  webDescription: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
