export interface Location {
  city: string;
  districts: string[];
}

export const ivoryCoastLocations: Location[] = [
  {
    city: 'Abidjan',
    districts: [
      'Cocody',
      'Plateau',
      'Marcory',
      'Yopougon',
      'Koumassi',
      'Treichville',
      'Adjamé',
      'Abobo',
      'Attécoubé',
      'Port-Bouët',
      'Bingerville',
      'Songon',
      'Anyama',
      'Riviera',
      'Angré',
      '2 Plateaux',
      'Vallon',
      'Blockhaus',
      'Zone 4',
      'Gonzagueville',
    ],
  },
  {
    city: 'Yamoussoukro',
    districts: [
      'Centre-Ville',
      'Habitat',
      'Dioulakro',
      'N\'Gokro',
      'Morofé',
      'Kossou',
    ],
  },
  {
    city: 'Bouaké',
    districts: [
      'Centre-Ville',
      'Air-France',
      'Dar-Es-Salam',
      'Belleville',
      'Kennedy',
      'Nimbo',
      'Sokoura',
    ],
  },
  {
    city: 'San-Pédro',
    districts: [
      'Centre-Ville',
      'Balmer',
      'Bardot',
      'Bardo',
      'Sable',
      'Wharf',
    ],
  },
  {
    city: 'Daloa',
    districts: [
      'Centre-Ville',
      'Commerce',
      'Tazibouo',
      'Lobia',
      'Garage',
    ],
  },
  {
    city: 'Korhogo',
    districts: [
      'Centre-Ville',
      'Petit Paris',
      'Tchéologo',
      'Sinistré',
      'Koko',
    ],
  },
  {
    city: 'Man',
    districts: [
      'Centre-Ville',
      'Libreville',
      'Dogomet',
      'Sokourala',
    ],
  },
  {
    city: 'Gagnoa',
    districts: [
      'Centre-Ville',
      'Dioulabougou',
      'Gnagbodougnoa',
      'Gabia',
    ],
  },
  {
    city: 'Grand-Bassam',
    districts: [
      'Quartier France',
      'Impérial',
      'Phare',
      'Moossou',
      'Vitré',
    ],
  },
  {
    city: 'Divo',
    districts: [
      'Centre-Ville',
      'Hiré',
      'Château',
      'Terminus',
    ],
  },
  {
    city: 'Abengourou',
    districts: [
      'Centre-Ville',
      'Sankadiokro',
      'Ehania',
      'Dokui',
    ],
  },
];

export const getAllCities = (): string[] => {
  return ivoryCoastLocations.map(location => location.city);
};

export const getAllDistricts = (): string[] => {
  return ivoryCoastLocations.flatMap(location => location.districts);
};

export const getDistrictsByCity = (city: string): string[] => {
  const location = ivoryCoastLocations.find(loc => loc.city.toLowerCase() === city.toLowerCase());
  return location ? location.districts : [];
};

export const searchLocations = (query: string): { city: string; district?: string }[] => {
  const lowerQuery = query.toLowerCase();
  const results: { city: string; district?: string }[] = [];

  ivoryCoastLocations.forEach(location => {
    if (location.city.toLowerCase().includes(lowerQuery)) {
      results.push({ city: location.city });
    }
    
    location.districts.forEach(district => {
      if (district.toLowerCase().includes(lowerQuery)) {
        results.push({ city: location.city, district });
      }
    });
  });

  return results;
};
