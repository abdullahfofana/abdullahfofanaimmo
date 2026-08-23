import { COTE_D_IVOIRE_SERVICES, NearbyService, ServiceCategory } from '@/constants/nearbyServices';

export interface CalculatedNearbyService extends NearbyService {
  distanceKm: number;
  distanceFormatted: string;
  walkingTimeMin: number;
  drivingTimeMin: number;
}

export interface ServiceCategoryConfig {
  key: ServiceCategory;
  nameFr: string;
  nameEn: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryConfig[] = [
  {
    key: 'education',
    nameFr: 'Éducation',
    nameEn: 'Schools & Unis',
    icon: 'GraduationCap',
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.1)',
  },
  {
    key: 'health',
    nameFr: 'Santé & Hôpitaux',
    nameEn: 'Hospitals & Clinics',
    icon: 'Hospital',
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
  },
  {
    key: 'pharmacy',
    nameFr: 'Pharmacies',
    nameEn: 'Pharmacies',
    icon: 'Cross',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
  },
  {
    key: 'shopping',
    nameFr: 'Supermarchés & Marchés',
    nameEn: 'Supermarkets & Malls',
    icon: 'ShoppingBag',
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
  },
  {
    key: 'food',
    nameFr: 'Restaurants & Cafés',
    nameEn: 'Dining & Cafés',
    icon: 'Utensils',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.1)',
  },
  {
    key: 'finance',
    nameFr: 'Banques & DAB',
    nameEn: 'Banks & ATMs',
    icon: 'Landmark',
    color: '#0D9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
  },
  {
    key: 'security',
    nameFr: 'Police & Sécurité',
    nameEn: 'Police & Security',
    icon: 'ShieldAlert',
    color: '#4F46E5',
    bgColor: 'rgba(79, 70, 229, 0.1)',
  },
  {
    key: 'transport',
    nameFr: 'Transports & Gares',
    nameEn: 'Transit & Stations',
    icon: 'Bus',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
  },
  {
    key: 'fuel',
    nameFr: 'Stations-Service',
    nameEn: 'Gas Stations',
    icon: 'Fuel',
    color: '#0284C7',
    bgColor: 'rgba(2, 132, 199, 0.1)',
  },
];

// Haversine geodesic distance in kilometers
export function calculateGeodesicDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  return Math.round(R * c * 100) / 100;
}

export function formatDistanceString(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function estimateWalkingTimeMin(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 4.8) * 60)); // ~4.8 km/h walking speed
}

export function estimateDrivingTimeMin(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 28) * 60)); // ~28 km/h Abidjan urban driving
}

/**
 * Returns nearby services for a specific coordinate sorted by ascending distance.
 */
export function getNearbyServicesForCoordinates(
  latitude: number,
  longitude: number,
  options?: {
    maxDistanceKm?: number;
    category?: ServiceCategory | 'all';
    limit?: number;
  }
): CalculatedNearbyService[] {
  const maxDistance = options?.maxDistanceKm ?? 10;
  const categoryFilter = options?.category ?? 'all';
  const limit = options?.limit ?? 50;

  const results: CalculatedNearbyService[] = [];

  for (const service of COTE_D_IVOIRE_SERVICES) {
    if (categoryFilter !== 'all' && service.category !== categoryFilter) {
      continue;
    }

    const distKm = calculateGeodesicDistanceKm(
      latitude,
      longitude,
      service.latitude,
      service.longitude
    );

    if (distKm <= maxDistance) {
      results.push({
        ...service,
        distanceKm: distKm,
        distanceFormatted: formatDistanceString(distKm),
        walkingTimeMin: estimateWalkingTimeMin(distKm),
        drivingTimeMin: estimateDrivingTimeMin(distKm),
      });
    }
  }

  // Sort closest first
  results.sort((a, b) => a.distanceKm - b.distanceKm);

  return results.slice(0, limit);
}

/**
 * Returns a summary count of nearby services grouped by category.
 */
export function getNearbyServicesSummary(
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 5
): Record<ServiceCategory, number> {
  const services = getNearbyServicesForCoordinates(latitude, longitude, { maxDistanceKm });
  const summary: Record<ServiceCategory, number> = {
    education: 0,
    health: 0,
    pharmacy: 0,
    shopping: 0,
    food: 0,
    finance: 0,
    security: 0,
    transport: 0,
    fuel: 0,
  };

  for (const s of services) {
    summary[s.category] = (summary[s.category] || 0) + 1;
  }

  return summary;
}
