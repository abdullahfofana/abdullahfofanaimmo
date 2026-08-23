export interface AreaInfo {
  id: string;
  slug: string;
  name: string;
  nameFr: string;
  cityId: string;
  cityName: string;
  latitude: number;
  longitude: number;
  zoom: number;
  descriptionFr: string;
  descriptionEn: string;
  popularTypes: ('villa' | 'apartment' | 'house' | 'land' | 'commercial')[];
  subDistricts?: string[];
  bannerImage: string;
}

export interface CityInfo {
  id: string;
  slug: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  zoom: number;
  descriptionFr: string;
  descriptionEn: string;
  areas: AreaInfo[];
}

export const COTE_D_IVOIRE_CITIES: CityInfo[] = [
  {
    id: 'abidjan',
    slug: 'abidjan',
    name: 'Abidjan',
    country: 'Côte d\'Ivoire',
    latitude: 5.359952,
    longitude: -4.008256,
    zoom: 12,
    descriptionFr: 'Capitale économique de la Côte d\'Ivoire, carrefour financier et métropole cosmopolite bordée par la lagune Ébrié.',
    descriptionEn: 'Economic capital of Côte d\'Ivoire, financial hub and cosmopolitan metropolis bordered by the Ébrié lagoon.',
    areas: [
      {
        id: 'cocody',
        slug: 'cocody',
        name: 'Cocody',
        nameFr: 'Cocody',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.3599,
        longitude: -4.0083,
        zoom: 14,
        descriptionFr: 'Quartier résidentiel et diplomatique le plus prisé d\'Abidjan, réputé pour ses villas de luxe, ses ambassades et ses universités.',
        descriptionEn: 'The most prestigious residential and diplomatic district in Abidjan, known for luxury villas, embassies, and universities.',
        popularTypes: ['villa', 'apartment', 'house'],
        subDistricts: ['Riviera 3', 'Riviera Golf', 'Riviera 4', 'Riviera Bonoumin', '2 Plateaux', 'Angré', 'Danga', 'Ambassades', 'Vallon', 'Mermoz'],
        bannerImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
      },
      {
        id: 'riviera',
        slug: 'riviera',
        name: 'Riviera',
        nameFr: 'Riviera (Cocody)',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.3780,
        longitude: -3.9720,
        zoom: 14,
        descriptionFr: 'Secteur d\'excellence de Cocody comprenant la Riviera 3, le Golf, la Riviera 4 et Bonoumin. Idéal pour les familles et cadres expatriés.',
        descriptionEn: 'Prime sector of Cocody including Riviera 3, Golf, Riviera 4 and Bonoumin. Ideal for families and expatriates.',
        popularTypes: ['villa', 'apartment', 'house'],
        subDistricts: ['Riviera 3', 'Riviera Golf', 'Riviera 4', 'Riviera Bonoumin', 'Riviera Palmeraie', 'Riviera Attoban'],
        bannerImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      },
      {
        id: 'deux_plateaux',
        slug: 'deux-plateaux',
        name: '2 Plateaux',
        nameFr: 'Deux Plateaux (Cocody)',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.3650,
        longitude: -4.0180,
        zoom: 14,
        descriptionFr: 'Zone résidentielle animée et haut de gamme, connue pour ses restaurants gastronomiques, commerces chic (Vallon) et appartements standing.',
        descriptionEn: 'Vibrant upscale residential area, known for fine dining, chic boutiques (Vallon) and luxury apartments.',
        popularTypes: ['apartment', 'villa', 'commercial'],
        subDistricts: ['Vallon', '7ème Tranche', 'Aghien', 'Las Palmas', 'Sanon'],
        bannerImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      },
      {
        id: 'angre',
        slug: 'angre',
        name: 'Angré',
        nameFr: 'Angré (Cocody)',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.4050,
        longitude: -3.9890,
        zoom: 14,
        descriptionFr: 'Quartier en plein essor moderne, offrant un cadre de vie sécurisé avec le CHU d\'Angré, des résidences neuves et de nombreux commerces.',
        descriptionEn: 'Rapidly growing modern district, offering secure residences, the Angré University Hospital, and commercial facilities.',
        popularTypes: ['apartment', 'house', 'villa'],
        subDistricts: ['Angré 7ème Tranche', 'Angré 8ème Tranche', 'Angré 9ème Tranche', 'Château', 'Nouveau CHU', 'Mahou'],
        bannerImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
      },
      {
        id: 'plateau',
        slug: 'plateau',
        name: 'Plateau',
        nameFr: 'Plateau (Centre des Affaires)',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.3247,
        longitude: -4.0127,
        zoom: 15,
        descriptionFr: 'Le "Manhattan ivoirien", cœur institutionnel, bancaire et économique du pays avec ses gratte-ciels et bureaux de standing.',
        descriptionEn: 'The business and banking hub of Côte d\'Ivoire featuring high-rise towers, corporate headquarters, and luxury offices.',
        popularTypes: ['apartment', 'commercial'],
        subDistricts: ['Centre des Affaires', 'Cité Administrative', 'Commerce', 'Lagunaire'],
        bannerImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      },
      {
        id: 'marcory',
        slug: 'marcory',
        name: 'Marcory',
        nameFr: 'Marcory / Zone 4',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.2892,
        longitude: -3.9847,
        zoom: 14,
        descriptionFr: 'Quartier cosmopolite très recherché pour sa vie nocturne, ses centres commerciaux (Cap Sud, Playce) et la célèbre Zone 4.',
        descriptionEn: 'Cosmopolitan district sought after for its vibrant nightlife, shopping malls (Cap Sud, Playce) and Zone 4 & Biétry.',
        popularTypes: ['apartment', 'villa', 'commercial'],
        subDistricts: ['Zone 4C', 'Zone 4A', 'Biétry', 'Marcory Résidentiel', 'Anoumabo'],
        bannerImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
      },
      {
        id: 'yopougon',
        slug: 'yopougon',
        name: 'Yopougon',
        nameFr: 'Yopougon',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.3400,
        longitude: -4.0800,
        zoom: 13,
        descriptionFr: 'La plus grande commune d\'Abidjan, dynamique et chaleureuse, offrant un marché locatif et résidentiel très actif et accessible.',
        descriptionEn: 'The largest municipality in Abidjan, vibrant and welcoming, with an active and accessible housing and rental market.',
        popularTypes: ['house', 'apartment', 'land'],
        subDistricts: ['Niangon', 'Toit Rouge', 'Maroc', 'Selmer', 'Sideci', 'Ananeraie', 'Gesco'],
        bannerImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200',
      },
      {
        id: 'bingerville',
        slug: 'bingerville',
        name: 'Bingerville',
        nameFr: 'Bingerville',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.3560,
        longitude: -3.8890,
        zoom: 14,
        descriptionFr: 'Ancienne capitale coloniale, havre de paix verdoyant et zone d\'expansion immobilière privilégiée pour villas et terrains sécurisés.',
        descriptionEn: 'Historic green haven and prime urban expansion zone for gated community villas and titled land plots.',
        popularTypes: ['villa', 'land', 'house'],
        subDistricts: ['Jardin Botanique', 'Sehia', 'Blanchon', 'Feh Kessé', 'Akandjé'],
        bannerImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      },
      {
        id: 'koumassi',
        slug: 'koumassi',
        name: 'Koumassi',
        nameFr: 'Koumassi',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.3000,
        longitude: -3.9500,
        zoom: 14,
        descriptionFr: 'Commune moderne réaménagée, proche de la Zone Industrielle et de l\'aéroport, avec de nouvelles résidences standing.',
        descriptionEn: 'Modernized municipality, close to the Industrial Zone and international airport, with new residential complexes.',
        popularTypes: ['apartment', 'house', 'commercial'],
        subDistricts: ['Zone Industrielle', 'Remblais', 'Soweto', 'Grand Campement'],
        bannerImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
      },
      {
        id: 'port_bouet',
        slug: 'port-bouet',
        name: 'Port-Bouët',
        nameFr: 'Port-Bouët / Vridi',
        cityId: 'abidjan',
        cityName: 'Abidjan',
        latitude: 5.2500,
        longitude: -3.9300,
        zoom: 13,
        descriptionFr: 'Bordée par l\'océan Atlantique, abrite l\'aéroport international FHB, la zone portuaire de Vridi et la route de Grand-Bassam.',
        descriptionEn: 'Bordered by the Atlantic Ocean, hosting the FHB International Airport, Vridi port zone, and coastal residences.',
        popularTypes: ['house', 'land', 'commercial', 'villa'],
        subDistricts: ['Aéroport FHB', 'Vridi', 'Gonzagueville', 'Jean Folly', 'Phare'],
        bannerImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
      },
      {
        id: 'grand_bassam',
        slug: 'grand-bassam',
        name: 'Grand-Bassam',
        nameFr: 'Grand-Bassam (Ville Historique)',
        cityId: 'abidjan',
        cityName: 'Grand-Bassam',
        latitude: 5.2050,
        longitude: -3.7380,
        zoom: 13,
        descriptionFr: 'Ville classée au patrimoine mondial de l\'UNESCO, réputée pour ses plages, ses résidences balnéaires et sa proximité avec Abidjan (25 min par autoroute).',
        descriptionEn: 'UNESCO World Heritage city, famous for beaches, seaside resort villas, and fast highway access to Abidjan (25 min).',
        popularTypes: ['villa', 'land', 'house'],
        subDistricts: ['Quartier France', 'Impérial', 'Phare', 'Moossou', 'Vitré 1 & 2', 'Rosiers'],
        bannerImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
      },
      {
        id: 'assinie',
        slug: 'assinie',
        name: 'Assinie',
        nameFr: 'Assinie-Mafia',
        cityId: 'abidjan',
        cityName: 'Assinie',
        latitude: 5.1320,
        longitude: -3.2840,
        zoom: 12,
        descriptionFr: 'Le joyau balnéaire de Côte d\'Ivoire, réputé pour ses villas pieds dans l\'eau, ses lodges luxueux entre lagune et océan.',
        descriptionEn: 'The premier luxury beach haven of Côte d\'Ivoire, renowned for waterfront villas and private beach estates.',
        popularTypes: ['villa', 'land'],
        subDistricts: ['Assinie Mafia', 'Assouindé', 'Mandjan', 'La Passe'],
        bannerImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200',
      },
    ],
  },
  {
    id: 'yamoussoukro',
    slug: 'yamoussoukro',
    name: 'Yamoussoukro',
    country: 'Côte d\'Ivoire',
    latitude: 6.8276,
    longitude: -5.2893,
    zoom: 13,
    descriptionFr: 'Capitale politique et administrative, abritant la Basilique Notre-Dame de la Paix, l\'INP-HB et des boulevards majestueux.',
    descriptionEn: 'Political and administrative capital, home to the Basilica of Our Lady of Peace, premier universities, and wide avenues.',
    areas: [
      {
        id: 'centre_ville_yakro',
        slug: 'centre-ville-yakro',
        name: 'Centre-Ville',
        nameFr: 'Centre-Ville Yamoussoukro',
        cityId: 'yamoussoukro',
        cityName: 'Yamoussoukro',
        latitude: 6.8200,
        longitude: -5.2750,
        zoom: 14,
        descriptionFr: 'Cœur administratif et commercial de la capitale politique.',
        descriptionEn: 'Administrative and commercial hub of the political capital.',
        popularTypes: ['house', 'apartment', 'commercial'],
        subDistricts: ['Habitat', 'Dioulakro', 'Commerce'],
        bannerImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
      },
      {
        id: 'morofe',
        slug: 'morofe',
        name: 'Morofé',
        nameFr: 'Morofé / INP-HB',
        cityId: 'yamoussoukro',
        cityName: 'Yamoussoukro',
        latitude: 6.8350,
        longitude: -5.2950,
        zoom: 14,
        descriptionFr: 'Quartier résidentiel universitaire et calme à proximité des grandes écoles.',
        descriptionEn: 'Quiet residential university district close to top engineering institutes.',
        popularTypes: ['house', 'villa', 'land'],
        subDistricts: ['Morofé 1', 'Morofé 2', 'Zone INP-HB'],
        bannerImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
      },
    ],
  },
  {
    id: 'bouake',
    slug: 'bouake',
    name: 'Bouaké',
    country: 'Côte d\'Ivoire',
    latitude: 7.6900,
    longitude: -5.0300,
    zoom: 13,
    descriptionFr: 'Deuxième plus grande ville de Côte d\'Ivoire, carrefour commercial stratégique du centre du pays.',
    descriptionEn: 'Second largest city in Côte d\'Ivoire and a strategic commercial crossroad in the center of the country.',
    areas: [
      {
        id: 'centre_ville_bouake',
        slug: 'centre-ville-bouake',
        name: 'Centre-Ville',
        nameFr: 'Centre-Ville Bouaké',
        cityId: 'bouake',
        cityName: 'Bouaké',
        latitude: 7.6850,
        longitude: -5.0250,
        zoom: 14,
        descriptionFr: 'Zone commerciale et administrative centrale de Bouaké.',
        descriptionEn: 'Central commercial and administrative zone of Bouaké.',
        popularTypes: ['house', 'apartment', 'commercial'],
        subDistricts: ['Commerce', 'Air-France', 'Koko'],
        bannerImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      },
      {
        id: 'kennedy_bouake',
        slug: 'kennedy-bouake',
        name: 'Kennedy',
        nameFr: 'Kennedy / Nimbo',
        cityId: 'bouake',
        cityName: 'Bouaké',
        latitude: 7.6950,
        longitude: -5.0450,
        zoom: 14,
        descriptionFr: 'Quartier résidentiel paisible avec terrains et villas spacieuses.',
        descriptionEn: 'Peaceful residential neighborhood with spacious villas and plots.',
        popularTypes: ['villa', 'house', 'land'],
        subDistricts: ['Kennedy', 'Nimbo', 'Belleville'],
        bannerImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200',
      },
    ],
  },
  {
    id: 'san_pedro',
    slug: 'san-pedro',
    name: 'San-Pédro',
    country: 'Côte d\'Ivoire',
    latitude: 4.7500,
    longitude: -6.6333,
    zoom: 13,
    descriptionFr: 'Deuxième pôle économique et premier port exportateur mondial de cacao, bordé par de splendides plages.',
    descriptionEn: 'Second economic pole and world leader in cocoa exports, bordered by pristine Atlantic beaches.',
    areas: [
      {
        id: 'balmer_san_pedro',
        slug: 'balmer-san-pedro',
        name: 'Balmer',
        nameFr: 'Balmer (Zone Côtière)',
        cityId: 'san_pedro',
        cityName: 'San-Pédro',
        latitude: 4.7400,
        longitude: -6.6450,
        zoom: 14,
        descriptionFr: 'Quartier résidentiel balnéaire de haut standing de San-Pédro.',
        descriptionEn: 'Upscale coastal residential neighborhood of San-Pédro.',
        popularTypes: ['villa', 'house', 'land'],
        subDistricts: ['Balmer Plage', 'Zone Résidentielle'],
        bannerImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
      },
    ],
  },
];

export const ALL_AREAS: AreaInfo[] = COTE_D_IVOIRE_CITIES.flatMap(city => city.areas);

export function getCityBySlug(slug: string): CityInfo | undefined {
  return COTE_D_IVOIRE_CITIES.find(c => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase());
}

export function getAreaBySlug(citySlug: string, areaSlug: string): AreaInfo | undefined {
  const city = getCityBySlug(citySlug);
  if (!city) {
    return ALL_AREAS.find(a => a.slug.toLowerCase() === areaSlug.toLowerCase() || a.id.toLowerCase() === areaSlug.toLowerCase());
  }
  return city.areas.find(a => a.slug.toLowerCase() === areaSlug.toLowerCase() || a.id.toLowerCase() === areaSlug.toLowerCase() || a.name.toLowerCase() === areaSlug.toLowerCase());
}

export function findAreaByName(name: string): AreaInfo | undefined {
  const lower = name.toLowerCase().trim();
  return ALL_AREAS.find(
    a => a.name.toLowerCase() === lower ||
         a.nameFr.toLowerCase() === lower ||
         a.slug.toLowerCase() === lower ||
         (a.subDistricts && a.subDistricts.some(sub => sub.toLowerCase().includes(lower) || lower.includes(sub.toLowerCase())))
  );
}
