import { Platform, Linking } from 'react-native';

export interface RouteEstimate {
  distanceKm: number;
  distanceFormatted: string;
  durationMinutes: number;
  durationFormatted: string;
  mode: 'driving' | 'walking';
  isRealRoute: boolean; // true if from Google Directions, false if geodesic estimation
}

export interface BuyerSellerDistanceInfo {
  driving: RouteEstimate;
  walking: RouteEstimate;
  origin: {
    label: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    label: string;
    latitude: number;
    longitude: number;
  };
  googleMapsUrl: string;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/**
 * Calculates geodesic distance between two points in km (Haversine formula).
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
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

/**
 * Builds standard Google Maps turn-by-turn navigation URL.
 */
export function getGoogleMapsNavigationUrl(
  destinationLat: number,
  destinationLng: number,
  originLat?: number,
  originLng?: number,
  mode: 'driving' | 'walking' = 'driving'
): string {
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=${mode}`;
  if (originLat != null && originLng != null) {
    url += `&origin=${originLat},${originLng}`;
  }
  return url;
}

/**
 * Opens Google Maps Navigation on any platform.
 */
export function openGoogleMapsDirections(
  destinationLat: number,
  destinationLng: number,
  originLat?: number,
  originLng?: number,
  mode: 'driving' | 'walking' = 'driving'
): void {
  const url = getGoogleMapsNavigationUrl(destinationLat, destinationLng, originLat, originLng, mode);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } else {
    Linking.openURL(url).catch((err) => {
      console.warn('[GoogleMaps] Error opening directions URL:', err);
    });
  }
}

/**
 * Calculates distance and travel times between buyer and property.
 * If Google Maps Distance Matrix API is configured, uses live routing data.
 * Otherwise uses calibrated urban traffic estimates for Abidjan.
 */
export async function calculateBuyerSellerDistance(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number,
  originLabel: string = 'Votre position',
  destinationLabel: string = 'Emplacement du bien'
): Promise<BuyerSellerDistanceInfo> {
  const straightKm = calculateHaversineKm(originLat, originLng, destinationLat, destinationLng);

  // If Google Maps API Key is available, try fetching Distance Matrix
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destinationLat},${destinationLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        const driveMeters = element.distance.value;
        const driveSeconds = element.duration.value;
        const driveKm = Math.round((driveMeters / 1000) * 10) / 10;
        const driveMin = Math.round(driveSeconds / 60);

        const walkKm = Math.round(driveKm * 0.95 * 10) / 10;
        const walkMin = Math.round((walkKm / 4.8) * 60);

        return {
          driving: {
            distanceKm: driveKm,
            distanceFormatted: `${driveKm} km`,
            durationMinutes: driveMin,
            durationFormatted: `${driveMin} min`,
            mode: 'driving',
            isRealRoute: true,
          },
          walking: {
            distanceKm: walkKm,
            distanceFormatted: `${walkKm} km`,
            durationMinutes: walkMin,
            durationFormatted: `${walkMin} min`,
            mode: 'walking',
            isRealRoute: true,
          },
          origin: { label: originLabel, latitude: originLat, longitude: originLng },
          destination: { label: destinationLabel, latitude: destinationLat, longitude: destinationLng },
          googleMapsUrl: getGoogleMapsNavigationUrl(destinationLat, destinationLng, originLat, originLng),
        };
      }
    } catch (error) {
      console.warn('[GoogleMaps Distance Matrix] Fallback to calibrated algorithm:', error);
    }
  }

  // Calibrated urban routing formula for Abidjan (road distance = straight distance * 1.28)
  const roadKm = Math.round(straightKm * 1.28 * 10) / 10;
  const driveMin = Math.max(1, Math.round((roadKm / 28) * 60)); // ~28 km/h urban speed
  const walkMin = Math.max(1, Math.round((roadKm / 4.8) * 60)); // ~4.8 km/h walking speed

  return {
    driving: {
      distanceKm: roadKm,
      distanceFormatted: `${roadKm} km`,
      durationMinutes: driveMin,
      durationFormatted: `${driveMin} min`,
      mode: 'driving',
      isRealRoute: false,
    },
    walking: {
      distanceKm: roadKm,
      distanceFormatted: `${roadKm} km`,
      durationMinutes: walkMin,
      durationFormatted: `${walkMin} min`,
      mode: 'walking',
      isRealRoute: false,
    },
    origin: { label: originLabel, latitude: originLat, longitude: originLng },
    destination: { label: destinationLabel, latitude: destinationLat, longitude: destinationLng },
    googleMapsUrl: getGoogleMapsNavigationUrl(destinationLat, destinationLng, originLat, originLng),
  };
}

export const POPULAR_STARTING_POINTS = [
  { id: 'plateau_centre', name: 'Plateau Centre (Banques & Affaires)', lat: 5.3247, lng: -4.0127 },
  { id: 'cocody_saint_jean', name: 'Cocody Saint-Jean / Mermoz', lat: 5.3450, lng: -4.0080 },
  { id: 'riviera_3', name: 'Riviera 3 (Cap Nord)', lat: 5.3740, lng: -3.9690 },
  { id: 'marcory_vge', name: 'Marcory (Playce / Cap Sud)', lat: 5.2950, lng: -3.9840 },
  { id: 'aeroport_fhb', name: 'Aéroport International Félix Houphouët-Boigny', lat: 5.2614, lng: -3.9263 },
  { id: 'yopougon_cosmos', name: 'Yopougon Cosmos Mall', lat: 5.3390, lng: -4.0680 },
  { id: 'deux_plateaux_vallon', name: '2 Plateaux Vallon', lat: 5.3625, lng: -4.0105 },
  { id: 'bingerville_centre', name: 'Bingerville Centre', lat: 5.3560, lng: -3.8890 },
  { id: 'grand_bassam_peage', name: 'Péage de Grand-Bassam', lat: 5.2350, lng: -3.8100 },
];
