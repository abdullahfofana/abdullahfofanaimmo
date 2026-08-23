import { ivoryCoastLocations } from '@/constants/ivoryCoastLocations';

export interface GeocodedLocation {
  address: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/**
 * Searches for locations matching a query string in Côte d'Ivoire.
 * Uses Google Places API when key is available, or built-in geographic database.
 */
export async function searchLocationSuggestions(query: string): Promise<GeocodedLocation[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();

  // Try Google Places Autocomplete if API Key available
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        cleanQuery
      )}&components=country:ci&language=fr&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.predictions?.length > 0) {
        const results: GeocodedLocation[] = [];
        for (const pred of data.predictions.slice(0, 5)) {
          // Get Place Details for coordinates
          try {
            const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pred.place_id}&fields=geometry,formatted_address,address_components&key=${GOOGLE_MAPS_API_KEY}`;
            const detailRes = await fetch(detailUrl);
            const detailData = await detailRes.json();

            if (detailData.status === 'OK' && detailData.result?.geometry?.location) {
              const loc = detailData.result.geometry.location;
              results.push({
                address: pred.structured_formatting?.main_text || pred.description,
                district: pred.structured_formatting?.secondary_text || 'Abidjan',
                city: 'Abidjan',
                country: 'Côte d\'Ivoire',
                latitude: loc.lat,
                longitude: loc.lng,
                formattedAddress: detailData.result.formatted_address || pred.description,
              });
            }
          } catch (e) {
            console.warn('[Google Places Details] Error:', e);
          }
        }
        if (results.length > 0) return results;
      }
    } catch (err) {
      console.warn('[Google Places Autocomplete] Fallback to internal directory:', err);
    }
  }

  // Fallback to internal Ivory Coast directory
  const lower = cleanQuery.toLowerCase();
  const results: GeocodedLocation[] = [];

  // Known anchor coordinates
  const KNOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'cocody': { lat: 5.3599, lng: -4.0083 },
    'riviera': { lat: 5.3780, lng: -3.9720 },
    'riviera 3': { lat: 5.3740, lng: -3.9690 },
    '2 plateaux': { lat: 5.3650, lng: -4.0180 },
    'angré': { lat: 5.4050, lng: -3.9890 },
    'plateau': { lat: 5.3247, lng: -4.0127 },
    'marcory': { lat: 5.2892, lng: -3.9847 },
    'zone 4': { lat: 5.2860, lng: -3.9810 },
    'biétry': { lat: 5.2795, lng: -3.9785 },
    'yopougon': { lat: 5.3400, lng: -4.0800 },
    'bingerville': { lat: 5.3560, lng: -3.8890 },
    'grand-bassam': { lat: 5.2050, lng: -3.7380 },
    'assinie': { lat: 5.1320, lng: -3.2840 },
    'yamoussoukro': { lat: 6.8276, lng: -5.2893 },
    'bouaké': { lat: 7.6900, lng: -5.0300 },
    'san-pédro': { lat: 4.7500, lng: -6.6333 },
  };

  for (const loc of ivoryCoastLocations) {
    if (loc.city.toLowerCase().includes(lower)) {
      const coords = KNOWN_COORDINATES[loc.city.toLowerCase()] || { lat: 5.3599, lng: -4.0083 };
      results.push({
        address: loc.city,
        district: 'Centre',
        city: loc.city,
        country: 'Côte d\'Ivoire',
        latitude: coords.lat,
        longitude: coords.lng,
        formattedAddress: `${loc.city}, Côte d'Ivoire`,
      });
    }

    for (const district of loc.districts) {
      if (district.toLowerCase().includes(lower)) {
        const coords = KNOWN_COORDINATES[district.toLowerCase()] ||
          KNOWN_COORDINATES[loc.city.toLowerCase()] || { lat: 5.3599, lng: -4.0083 };
        results.push({
          address: district,
          district: district,
          city: loc.city,
          country: 'Côte d\'Ivoire',
          latitude: coords.lat,
          longitude: coords.lng,
          formattedAddress: `${district}, ${loc.city}, Côte d'Ivoire`,
        });
      }
    }
  }

  return results.slice(0, 8);
}

/**
 * Reverse geocodes coordinates to address, district, city.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<GeocodedLocation> {
  // If Google Geocoding is available
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=fr&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.results?.[0]) {
        const result = data.results[0];
        let district = 'Cocody';
        let city = 'Abidjan';
        let street = result.formatted_address;

        for (const comp of result.address_components) {
          if (comp.types.includes('sublocality') || comp.types.includes('neighborhood')) {
            district = comp.long_name;
          }
          if (comp.types.includes('locality')) {
            city = comp.long_name;
          }
          if (comp.types.includes('route')) {
            street = comp.long_name;
          }
        }

        return {
          address: street,
          district,
          city,
          country: 'Côte d\'Ivoire',
          latitude,
          longitude,
          formattedAddress: result.formatted_address,
        };
      }
    } catch (e) {
      console.warn('[Google Reverse Geocode] Fallback to heuristic:', e);
    }
  }

  // Heuristic based on proximity to known Abidjan landmarks
  let closestDistrict = 'Cocody';
  let closestCity = 'Abidjan';
  let minDistance = 999;

  const DISTRICT_ANCHORS: { name: string; city: string; lat: number; lng: number }[] = [
    { name: 'Riviera 3', city: 'Abidjan', lat: 5.3740, lng: -3.9690 },
    { name: '2 Plateaux', city: 'Abidjan', lat: 5.3650, lng: -4.0180 },
    { name: 'Angré', city: 'Abidjan', lat: 5.4050, lng: -3.9890 },
    { name: 'Plateau', city: 'Abidjan', lat: 5.3247, lng: -4.0127 },
    { name: 'Marcory Zone 4', city: 'Abidjan', lat: 5.2892, lng: -3.9847 },
    { name: 'Yopougon', city: 'Abidjan', lat: 5.3400, lng: -4.0800 },
    { name: 'Bingerville', city: 'Abidjan', lat: 5.3560, lng: -3.8890 },
    { name: 'Grand-Bassam', city: 'Grand-Bassam', lat: 5.2050, lng: -3.7380 },
    { name: 'Assinie', city: 'Assinie', lat: 5.1320, lng: -3.2840 },
    { name: 'Yamoussoukro', city: 'Yamoussoukro', lat: 6.8276, lng: -5.2893 },
    { name: 'Bouaké', city: 'Bouaké', lat: 7.6900, lng: -5.0300 },
  ];

  for (const anchor of DISTRICT_ANCHORS) {
    const dist = Math.hypot(latitude - anchor.lat, longitude - anchor.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestDistrict = anchor.name;
      closestCity = anchor.city;
    }
  }

  return {
    address: `${closestDistrict}`,
    district: closestDistrict,
    city: closestCity,
    country: 'Côte d\'Ivoire',
    latitude,
    longitude,
    formattedAddress: `${closestDistrict}, ${closestCity}, Côte d'Ivoire`,
  };
}
