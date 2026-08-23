import { Property, PropertyType, PropertyStatus } from '@/types/property';

export interface AreaPriceStats {
  areaName: string;
  cityName: string;
  totalCount: number;
  saleCount: number;
  rentCount: number;
  avgSalePrice: number | null;
  avgRentPrice: number | null;
  minSalePrice: number | null;
  maxSalePrice: number | null;
  minRentPrice: number | null;
  maxRentPrice: number | null;
  avgPricePerM2: number | null;
  hasEnoughData: boolean;
  typeBreakdown: {
    type: PropertyType;
    count: number;
    avgPrice: number | null;
  }[];
  messageFr?: string;
  messageEn?: string;
}

export interface CityPriceStats {
  cityName: string;
  totalCount: number;
  avgSalePrice: number | null;
  avgRentPrice: number | null;
  hasEnoughData: boolean;
  areas: AreaPriceStats[];
}

const MINIMUM_LISTINGS_THRESHOLD = 2;

export function formatPriceFCFA(price: number | null, isRent: boolean = false): string {
  if (price === null || isNaN(price)) return 'N/A';
  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toFixed(1)} Mrd FCFA${isRent ? ' /mois' : ''}`;
  }
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)}M FCFA${isRent ? ' /mois' : ''}`;
  }
  if (price >= 1_000) {
    return `${(price / 1_000).toFixed(0)}k FCFA${isRent ? ' /mois' : ''}`;
  }
  return `${price.toLocaleString('fr-FR')} FCFA${isRent ? ' /mois' : ''}`;
}

/**
 * Dynamically computes market statistics for a given area or city from a properties array.
 */
export function calculateAreaPriceStats(
  properties: Property[],
  areaName: string,
  cityName: string = 'Abidjan',
  minThreshold: number = MINIMUM_LISTINGS_THRESHOLD
): AreaPriceStats {
  const normalizedArea = areaName.toLowerCase().trim();
  const normalizedCity = cityName.toLowerCase().trim();

  const matchingProperties = properties.filter((p) => {
    const pDistrict = (p.location?.district || '').toLowerCase();
    const pCity = (p.location?.city || '').toLowerCase();
    const pAddress = (p.location?.address || '').toLowerCase();
    const pTitle = (p.title || '').toLowerCase();

    const matchesCity = normalizedCity === 'all' || pCity.includes(normalizedCity) || normalizedCity.includes(pCity);
    const matchesArea =
      normalizedArea === 'all' ||
      pDistrict.includes(normalizedArea) ||
      normalizedArea.includes(pDistrict) ||
      pAddress.includes(normalizedArea) ||
      pTitle.includes(normalizedArea);

    return matchesCity && matchesArea;
  });

  const totalCount = matchingProperties.length;
  const hasEnoughData = totalCount >= minThreshold;

  if (!hasEnoughData) {
    return {
      areaName,
      cityName,
      totalCount,
      saleCount: matchingProperties.filter((p) => p.status === 'sale').length,
      rentCount: matchingProperties.filter((p) => p.status === 'rent').length,
      avgSalePrice: null,
      avgRentPrice: null,
      minSalePrice: null,
      maxSalePrice: null,
      minRentPrice: null,
      maxRentPrice: null,
      avgPricePerM2: null,
      hasEnoughData: false,
      typeBreakdown: [],
      messageFr: 'Données insuffisantes pour estimer la moyenne',
      messageEn: 'Not enough data available',
    };
  }

  const saleProps = matchingProperties.filter((p) => p.status === 'sale' && p.price > 0);
  const rentProps = matchingProperties.filter((p) => p.status === 'rent' && p.price > 0);

  const salePrices = saleProps.map((p) => p.price);
  const rentPrices = rentProps.map((p) => p.price);

  const avgSalePrice =
    salePrices.length > 0
      ? Math.round(salePrices.reduce((a, b) => a + b, 0) / salePrices.length)
      : null;

  const avgRentPrice =
    rentPrices.length > 0
      ? Math.round(rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length)
      : null;

  const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
  const maxSalePrice = salePrices.length > 0 ? Math.max(...salePrices) : null;
  const minRentPrice = rentPrices.length > 0 ? Math.min(...rentPrices) : null;
  const maxRentPrice = rentPrices.length > 0 ? Math.max(...rentPrices) : null;

  // Price per m² (sales with known area > 0)
  const propsWithM2 = saleProps.filter((p) => p.area && p.area > 0);
  const avgPricePerM2 =
    propsWithM2.length > 0
      ? Math.round(
          propsWithM2.reduce((acc, p) => acc + p.price / p.area, 0) / propsWithM2.length
        )
      : null;

  // Type Breakdown
  const propertyTypes: PropertyType[] = ['villa', 'apartment', 'house', 'land', 'commercial'];
  const typeBreakdown = propertyTypes.map((type) => {
    const typeProps = matchingProperties.filter((p) => p.type === type);
    const avgPrice =
      typeProps.length > 0
        ? Math.round(typeProps.reduce((a, b) => a + b.price, 0) / typeProps.length)
        : null;
    return {
      type,
      count: typeProps.length,
      avgPrice,
    };
  }).filter((item) => item.count > 0);

  return {
    areaName,
    cityName,
    totalCount,
    saleCount: saleProps.length,
    rentCount: rentProps.length,
    avgSalePrice,
    avgRentPrice,
    minSalePrice,
    maxSalePrice,
    minRentPrice,
    maxRentPrice,
    avgPricePerM2,
    hasEnoughData: true,
    typeBreakdown,
  };
}

/**
 * Calculates market statistics across all top areas in a given city.
 */
export function calculateCityMarketOverview(
  properties: Property[],
  areas: { name: string; cityName: string }[]
): AreaPriceStats[] {
  return areas.map((area) =>
    calculateAreaPriceStats(properties, area.name, area.cityName)
  );
}
