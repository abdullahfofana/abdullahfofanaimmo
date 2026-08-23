import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  GraduationCap,
  Hospital,
  ShoppingBag,
  Utensils,
  Landmark,
  ShieldAlert,
  Bus,
  Fuel,
  Navigation,
  CheckCircle2,
  Clock,
  Car,
  Footprints,
  Compass,
} from 'lucide-react-native';

import {
  getNearbyServicesForCoordinates,
  SERVICE_CATEGORIES,
  CalculatedNearbyService,
} from '@/utils/nearbyServices';
import { ServiceCategory } from '@/constants/nearbyServices';
import { useLanguage } from '@/providers/LanguageProvider';

interface NearbyServicesSectionProps {
  latitude: number;
  longitude: number;
  onSelectServiceOnMap?: (service: CalculatedNearbyService) => void;
  maxDistanceKm?: number;
}

export default function NearbyServicesSection({
  latitude,
  longitude,
  onSelectServiceOnMap,
  maxDistanceKm = 8,
}: NearbyServicesSectionProps) {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');

  const allServices = useMemo(() => {
    return getNearbyServicesForCoordinates(latitude, longitude, {
      maxDistanceKm,
      category: 'all',
      limit: 40,
    });
  }, [latitude, longitude, maxDistanceKm]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return allServices;
    return allServices.filter((s) => s.category === selectedCategory);
  }, [allServices, selectedCategory]);

  const renderCategoryIcon = (category: ServiceCategory, color: string = '#059669', size: number = 16) => {
    switch (category) {
      case 'education':
        return <GraduationCap size={size} color={color} />;
      case 'health':
        return <Hospital size={size} color={color} />;
      case 'pharmacy':
        return <Hospital size={size} color={color} />;
      case 'shopping':
        return <ShoppingBag size={size} color={color} />;
      case 'food':
        return <Utensils size={size} color={color} />;
      case 'finance':
        return <Landmark size={size} color={color} />;
      case 'security':
        return <ShieldAlert size={size} color={color} />;
      case 'transport':
        return <Bus size={size} color={color} />;
      case 'fuel':
        return <Fuel size={size} color={color} />;
      default:
        return <Navigation size={size} color={color} />;
    }
  };

  const getCategoryColor = (category: ServiceCategory) => {
    const config = SERVICE_CATEGORIES.find((c) => c.key === category);
    return config?.color || '#059669';
  };

  const getCategoryBgColor = (category: ServiceCategory) => {
    const config = SERVICE_CATEGORIES.find((c) => c.key === category);
    return config?.bgColor || 'rgba(5, 150, 105, 0.1)';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Compass size={18} color="#059669" strokeWidth={2.4} />
          </View>
          <View>
            <Text style={styles.title}>
              {isFr ? 'Services & Commodités à Proximité' : 'Nearby Services & Amenities'}
            </Text>
            <Text style={styles.subtitle}>
              {isFr
                ? `${allServices.length} points d'intérêt répertoriés autour de ce bien`
                : `${allServices.length} places of interest identified near this property`}
            </Text>
          </View>
        </View>
      </View>

      {/* Category Pills Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryPill,
            selectedCategory === 'all' && styles.categoryPillActive,
          ]}
          onPress={() => setSelectedCategory('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.categoryPillText,
              selectedCategory === 'all' && styles.categoryPillTextActive,
            ]}
          >
            {isFr ? '✨ Tout afficher' : '✨ All'} ({allServices.length})
          </Text>
        </TouchableOpacity>

        {SERVICE_CATEGORIES.map((cat) => {
          const count = allServices.filter((s) => s.category === cat.key).length;
          if (count === 0) return null;
          const isSelected = selectedCategory === cat.key;

          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryPill,
                isSelected && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.8}
            >
              {renderCategoryIcon(cat.key, isSelected ? '#FFFFFF' : cat.color, 14)}
              <Text
                style={[
                  styles.categoryPillText,
                  isSelected && styles.categoryPillTextActive,
                ]}
              >
                {isFr ? cat.nameFr : cat.nameEn} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Services List */}
      <View style={styles.servicesList}>
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isFr
                ? 'Aucun service répertorié dans cette catégorie à moins de 8 km.'
                : 'No services found in this category within 8 km.'}
            </Text>
          </View>
        ) : (
          filteredServices.map((service) => {
            const catColor = getCategoryColor(service.category);
            const catBg = getCategoryBgColor(service.category);

            return (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceItem}
                onPress={() => onSelectServiceOnMap?.(service)}
                activeOpacity={0.85}
              >
                {/* Left Category Icon */}
                <View style={[styles.serviceIconWrap, { backgroundColor: catBg }]}>
                  {renderCategoryIcon(service.category, catColor, 18)}
                </View>

                {/* Center Content */}
                <View style={styles.serviceInfoCol}>
                  <Text style={styles.serviceName} numberOfLines={1}>
                    {service.name}
                  </Text>
                  <Text style={styles.serviceAddress} numberOfLines={1}>
                    {service.address} · {service.district}
                  </Text>
                </View>

                {/* Right Distance & Travel Badges */}
                <View style={styles.serviceDistanceCol}>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceBadgeText}>
                      {service.distanceFormatted}
                    </Text>
                  </View>
                  <View style={styles.travelTimeRow}>
                    <View style={styles.travelTimeItem}>
                      <Car size={11} color="#64748B" />
                      <Text style={styles.travelTimeText}>
                        ~{service.drivingTimeMin} min
                      </Text>
                    </View>
                    {service.distanceKm <= 2.5 && (
                      <View style={styles.travelTimeItem}>
                        <Footprints size={11} color="#64748B" />
                        <Text style={styles.travelTimeText}>
                          ~{service.walkingTimeMin} min
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    marginVertical: 12,
  },
  header: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Category Filter
  categoryScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },

  // Services List
  servicesList: {
    gap: 10,
    marginTop: 4,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfoCol: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  serviceAddress: {
    fontSize: 11.5,
    color: '#64748B',
  },
  serviceDistanceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  distanceBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
  },
  travelTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  travelTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  travelTimeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
