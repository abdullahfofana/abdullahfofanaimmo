import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Search as SearchIcon, X, Home, ChevronDown, MapPin, Map as MapIcon, List as ListIcon, Bell, Sparkles, Wand2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import PropertyCard from '@/components/PropertyCard';
import PropertyMap from '@/components/PropertyMap';
import { mockProperties } from '@/mocks/properties';
import { Property, PropertyType, PropertyStatus } from '@/types/property';
import { getColumns, getMaxContentWidth, useResponsive } from '@/constants/breakpoints';
import { useLanguage } from '@/providers/LanguageProvider';
import { ivoryCoastLocations } from '@/constants/ivoryCoastLocations';

import { usePropertySubmissions } from '@/providers/PropertySubmissionProvider';

interface Filters {
  type: PropertyType | 'all';
  status: PropertyStatus | 'all';
  minPrice: number;
  maxPrice: number;
  bedrooms: number | 'all';
  bathrooms: number | 'all';
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const params = useLocalSearchParams<{
    status?: string;
    type?: string;
    q?: string;
    location?: string;
    filter?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState<string>(params.q || '');
  const [activeStatus, setActiveStatus] = useState<PropertyStatus | 'all'>((params.status as PropertyStatus) || 'all');
  const [showTypePicker, setShowTypePicker] = useState<boolean>(false);
  const [showBedPicker, setShowBedPicker] = useState<boolean>(false);
  const [showBathPicker, setShowBathPicker] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [locationSearch, setLocationSearch] = useState<string>(params.location || '');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(mockProperties);
  const { isTablet, isDesktop } = useResponsive();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userId, setUserId] = useState<string | null>(null);
  const saveIntentMutation = trpc.search.saveIntent.useMutation();
  const parseSearchMutation = trpc.ai.parseSearch.useMutation();
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const { getApprovedSubmissions } = usePropertySubmissions();
  const viewFadeAnim = useRef(new Animated.Value(1)).current;
  const floatingButtonScale = useRef(new Animated.Value(1)).current;

  const [filters, setFilters] = useState<Filters>({
    type: (params.type as PropertyType) || 'all',
    status: (params.status as PropertyStatus) || 'all',
    minPrice: 0,
    maxPrice: 500000000,
    bedrooms: 'all',
    bathrooms: 'all',
  });

  // Sync params when they change
  useEffect(() => {
    if (params.q) setSearchQuery(params.q);
    if (params.location) setLocationSearch(params.location);
    if (params.status || params.type) {
      setFilters(prev => ({
        ...prev,
        status: (params.status as PropertyStatus) || prev.status,
        type: (params.type as PropertyType) || prev.type,
      }));
      setActiveStatus((params.status as PropertyStatus) || 'all');
    }
  }, [params.q, params.location, params.status, params.type]);

  useEffect(() => {
    // Get or create a persistent user ID for notifications
    const getUserId = async () => {
      let id = await AsyncStorage.getItem('rork_user_id');
      if (!id) {
        id = 'user_' + Date.now() + Math.random().toString(36).substring(7);
        await AsyncStorage.setItem('rork_user_id', id);
      }
      setUserId(id);
    };
    getUserId();
  }, []);

  const handleSaveSearch = () => {
    if (!userId) return;

    saveIntentMutation.mutate({
      userId,
      criteria: {
        query: searchQuery,
        type: filters.type === 'all' ? undefined : filters.type,
        location: locationSearch || searchQuery,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        bedrooms: filters.bedrooms === 'all' ? undefined : filters.bedrooms,
        bathrooms: filters.bathrooms === 'all' ? undefined : filters.bathrooms,
      }
    }, {
      onSuccess: () => {
        if (Platform.OS === 'web') {
          alert("Alert set! We'll notify you when a property matches your search.");
        } else {
          Alert.alert("Success", "We'll notify you when a property matches your search.");
        }
      },
      onError: () => {
        if (Platform.OS === 'web') {
          alert("Failed to save search alert.");
        } else {
          Alert.alert("Error", "Failed to save search alert.");
        }
      }
    });
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Fade-in animation when switching between list and map views
  useEffect(() => {
    viewFadeAnim.setValue(0);
    Animated.timing(viewFadeAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [viewMode]);

  const maxContentWidth = getMaxContentWidth(dimensions.width);
  const columns = getColumns(dimensions.width);
  const contentPadding = isDesktop ? Math.max((dimensions.width - maxContentWidth) / 2, Spacing.lg) : Spacing.lg;

  const approvedSubmissions = getApprovedSubmissions();

  const mapSubmissionToProperty = (submission: any): Property => ({
    id: submission.id,
    title: submission.title,
    description: submission.description,
    price: submission.price,
    currency: 'FCFA',
    type: submission.type,
    status: submission.status,
    bedrooms: submission.bedrooms,
    bathrooms: submission.bathrooms,
    area: submission.area,
    location: {
      ...submission.location,
      coordinates: submission.location.coordinates || { latitude: 5.359952, longitude: -4.008256 },
    },
    images: submission.photos,
    features: submission.features,
    agent: {
      id: 'agent-' + submission.id,
      name: submission.agent.name,
      phone: submission.agent.phone,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
    },
    isFeatured: false,
    createdAt: submission.submittedAt,
  });

  const allProperties = useMemo(() => [...approvedSubmissions.map(mapSubmissionToProperty), ...mockProperties], [approvedSubmissions]);

  const applyFilters = useCallback((query: string = searchQuery, currentFilters: Filters = filters) => {
    let filtered = allProperties;

    if (query.trim() !== '') {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(query.toLowerCase()) ||
          property.location.district.toLowerCase().includes(query.toLowerCase()) ||
          property.location.city.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (currentFilters.type !== 'all') {
      filtered = filtered.filter((property) => property.type === currentFilters.type);
    }

    if (currentFilters.status !== 'all') {
      filtered = filtered.filter((property) => property.status === currentFilters.status);
    }

    filtered = filtered.filter(
      (property) =>
        property.price >= currentFilters.minPrice &&
        property.price <= currentFilters.maxPrice
    );

    if (currentFilters.bedrooms !== 'all') {
      filtered = filtered.filter(
        (property) => property.bedrooms && typeof currentFilters.bedrooms === 'number' && property.bedrooms >= currentFilters.bedrooms
      );
    }

    if (currentFilters.bathrooms !== 'all') {
      filtered = filtered.filter(
        (property) => property.bathrooms && typeof currentFilters.bathrooms === 'number' && property.bathrooms >= currentFilters.bathrooms
      );
    }

    setFilteredProperties(filtered);
  }, [filters, searchQuery, allProperties]);

  const filteredLocations = useMemo(() => {
    if (!locationSearch) return ivoryCoastLocations;
    const lower = locationSearch.toLowerCase();
    return ivoryCoastLocations.map(loc => {
      // Check if city matches
      const cityMatch = loc.city.toLowerCase().includes(lower);
      // Check if any district matches
      const matchingDistricts = loc.districts.filter(d => d.toLowerCase().includes(lower));

      if (cityMatch) {
        // If city matches, return all districts (or maybe we should still filter districts? Let's return all for context)
        return loc;
      } else if (matchingDistricts.length > 0) {
        // If city doesn't match but districts do, return city with only matching districts
        return {
          ...loc,
          districts: matchingDistricts
        };
      }
      return null;
    }).filter(Boolean) as typeof ivoryCoastLocations;
  }, [locationSearch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, filters);
  };

  const handleSelectLocation = (city: string, district?: string) => {
    const locationText = district ? `${district}, ${city}` : city;
    setSearchQuery(locationText);
    applyFilters(locationText, filters);
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters, [key]: value } as Filters;
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    applyFilters(searchQuery, filters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters: Filters = {
      type: 'all',
      status: 'all',
      minPrice: 0,
      maxPrice: 500000000,
      bedrooms: 'all',
      bathrooms: 'all',
    };
    setFilters(resetFilters);
    applyFilters(searchQuery, resetFilters);
  };

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;

    try {
      const result = await parseSearchMutation.mutateAsync({ query: aiQuery });
      if (result.success && result.filters) {
        const aiFilters = result.filters;

        // Map AI result to our app's filter structure
        const newFilters: Filters = {
          type: (aiFilters.type as PropertyType) || 'all',
          status: (aiFilters.status as PropertyStatus) || 'all',
          minPrice: aiFilters.minPrice || 0,
          maxPrice: aiFilters.maxPrice || 500000000,
          bedrooms: aiFilters.bedrooms || 'all',
          bathrooms: aiFilters.bathrooms || 'all',
        };

        if (aiFilters.location) {
          setSearchQuery(aiFilters.location);
          setLocationSearch(aiFilters.location);
        }

        setFilters(newFilters);
        applyFilters(aiFilters.location || searchQuery, newFilters);
        setIsAIMode(false); // Switch back to see results
        setAiQuery('');

        if (Platform.OS === 'web') {
          // Optional: Toast or simple alert
        }
      }
    } catch (error) {
      console.error("AI Search failed", error);
      Alert.alert("AI Error", "Could not understand your request. Please try again.");
    }
  };

  // Synchronize route parameters (e.g. ?status=sale, ?status=rent, ?type=villa, ?q=...)
  useEffect(() => {
    let nextStatus: PropertyStatus | 'all' = 'all';
    if (params.status === 'sale' || params.status === 'rent') {
      nextStatus = params.status as PropertyStatus;
    } else if (params.status === 'all') {
      nextStatus = 'all';
    }

    let nextType: PropertyType | 'all' = 'all';
    if (params.type && ['apartment', 'house', 'villa', 'land', 'commercial'].includes(params.type.toLowerCase())) {
      nextType = params.type.toLowerCase() as PropertyType;
    }

    const nextQuery = params.q || params.location || '';

    setActiveStatus(nextStatus);
    if (nextQuery) {
      setSearchQuery(nextQuery);
      setLocationSearch(nextQuery);
    }

    const updatedFilters: Filters = {
      ...filters,
      status: nextStatus,
      type: nextType,
    };
    setFilters(updatedFilters);
    applyFilters(nextQuery || searchQuery, updatedFilters);
  }, [params.status, params.type, params.q, params.location, params.filter, applyFilters]);

  const handleStatusTabSelect = (status: PropertyStatus | 'all') => {
    setActiveStatus(status);
    const newFilters = { ...filters, status } as Filters;
    setFilters(newFilters);
    applyFilters(searchQuery, newFilters);
  };

  const renderItem = ({ item }: { item: Property }) => (
    <View style={[
      styles.gridItem,
      { width: isDesktop ? `${100 / columns}%` : isTablet ? '50%' : '100%' }
    ]}>
      <PropertyCard property={item} />
    </View>
  );

  const isMobile = !isTablet && !isDesktop;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View testID="searchHeader" style={[
        styles.header,
        { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding, backgroundColor: colors.background }
      ]}>
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow.md }]}>

          {/* Segmented Tabs - All / Buy / Rent */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => handleStatusTabSelect('all')}
              style={[
                styles.tabItem,
                activeStatus === 'all' && styles.tabItemActive,
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeStatus === 'all' && styles.tabTextActive,
              ]}>
                {t('search_all') || 'Tous'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleStatusTabSelect('sale')}
              style={[
                styles.tabItem,
                activeStatus === 'sale' && styles.tabItemActive,
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeStatus === 'sale' && styles.tabTextActive,
              ]}>
                {t('search_buy')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleStatusTabSelect('rent')}
              style={[
                styles.tabItem,
                activeStatus === 'rent' && styles.tabItemActive,
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeStatus === 'rent' && styles.tabTextActive,
              ]}>
                {t('search_rent')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inputs - Mobile/Desktop Layout */}
          <View style={styles.inputsContainer}>
            {isMobile ? (
              <View style={styles.mobileInputsColumn}>
                {/* Location */}
                <TouchableOpacity
                  testID="locationPickerButton"
                  onPress={() => setShowLocationPicker(true)}
                  style={[styles.inputField, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <MapPin size={20} color={colors.textSecondary} style={{ marginRight: Spacing.xs }} />
                  <Text style={[styles.inputFieldText, { color: searchQuery ? colors.text : colors.textSecondary, flex: 1 }]} numberOfLines={1}>
                    {searchQuery || t('search_location')}
                  </Text>
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => {
                      setSearchQuery('');
                      handleSearch('');
                    }}>
                      <X size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  {!searchQuery && <ChevronDown size={18} color={colors.textSecondary} />}
                </TouchableOpacity>

                {/* Property Type */}
                <TouchableOpacity
                  testID="typePickerButton"
                  onPress={() => setShowTypePicker(true)}
                  style={[styles.inputField, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <Home size={20} color={colors.textSecondary} style={{ marginRight: Spacing.xs }} />
                  <Text style={[styles.inputFieldText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {filters.type === 'all' ? t('search_any') : filters.type}
                  </Text>
                  <ChevronDown size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Bedrooms */}
                <TouchableOpacity
                  testID="bedPickerButton"
                  onPress={() => setShowBedPicker(true)}
                  style={[styles.inputField, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <Text style={[styles.inputFieldPrefix, { color: colors.textSecondary, marginRight: Spacing.xs }]}>Beds</Text>
                  <Text style={[styles.inputFieldText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {filters.bedrooms === 'all' ? t('search_any') : `${filters.bedrooms}+`}
                  </Text>
                  <ChevronDown size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Bathrooms */}
                <TouchableOpacity
                  testID="bathPickerButton"
                  onPress={() => setShowBathPicker(true)}
                  style={[styles.inputField, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <Text style={[styles.inputFieldPrefix, { color: colors.textSecondary, marginRight: Spacing.xs }]}>Baths</Text>
                  <Text style={[styles.inputFieldText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {filters.bathrooms === 'all' ? t('search_any') : `${filters.bathrooms}+`}
                  </Text>
                  <ChevronDown size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputsRow}>
                {/* Location */}
                <TouchableOpacity
                  testID="locationPickerButton"
                  onPress={() => setShowLocationPicker(true)}
                  style={[styles.inputPill, { flex: 2, backgroundColor: colors.backgroundSecondary }]}
                >
                  <MapPin size={20} color={colors.primary} />
                  <Text style={[styles.inputPillValue, { color: searchQuery ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                    {searchQuery || t('search_location')}
                  </Text>
                  {searchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => {
                      setSearchQuery('');
                      handleSearch('');
                    }}>
                      <X size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ) : (
                    <ChevronDown size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>

                {/* Property Type */}
                <TouchableOpacity
                  testID="typePickerButton"
                  onPress={() => setShowTypePicker(true)}
                  style={[styles.inputPill, { flex: 1.2, backgroundColor: colors.backgroundSecondary }]}
                >
                  <Home size={20} color={colors.primary} />
                  <Text style={[styles.inputPillValue, { color: colors.text }]} numberOfLines={1}>
                    {filters.type === 'all' ? t('search_any') : filters.type}
                  </Text>
                  <ChevronDown size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Bedrooms */}
                <TouchableOpacity
                  testID="bedPickerButton"
                  onPress={() => setShowBedPicker(true)}
                  style={[styles.inputPill, { flex: 1, backgroundColor: colors.backgroundSecondary }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputPillPrefix, { color: colors.textSecondary }]}>BED</Text>
                    <Text style={[styles.inputPillValue, { color: colors.text, marginTop: -2 }]} numberOfLines={1}>
                      {filters.bedrooms === 'all' ? t('search_any') : `${filters.bedrooms}+`}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Bathrooms */}
                <TouchableOpacity
                  testID="bathPickerButton"
                  onPress={() => setShowBathPicker(true)}
                  style={[styles.inputPill, { flex: 1, backgroundColor: colors.backgroundSecondary }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputPillPrefix, { color: colors.textSecondary }]}>BTH</Text>
                    <Text style={[styles.inputPillValue, { color: colors.text, marginTop: -2 }]} numberOfLines={1}>
                      {filters.bathrooms === 'all' ? t('search_any') : `${filters.bathrooms}+`}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

          </View>

          {/* AI Search Overlay */}
          {isAIMode && (
            <View style={[styles.inputsContainer, { marginTop: -10 }]}>
              <View style={[styles.inputField, { backgroundColor: colors.backgroundSecondary, borderColor: colors.primary, height: 100, alignItems: 'flex-start', paddingVertical: 12 }]}>
                <Sparkles size={20} color={colors.primary} style={{ marginRight: Spacing.sm, marginTop: 4 }} />
                <TextInput
                  style={[styles.inputFieldText, { color: colors.text, flex: 1, height: '100%', textAlignVertical: 'top' }]}
                  placeholder={t('search_ai_placeholder') || "Describe what you want (e.g. '3 bedroom villa with pool in Cocody under 100M')"}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={aiQuery}
                  onChangeText={setAiQuery}
                  autoFocus
                />
                {parseSearchMutation.isPending && <ActivityIndicator color={colors.primary} style={{ marginLeft: 8 }} />}
              </View>
            </View>
          )}

          {/* Search Button or AI Button */}
          <TouchableOpacity
            testID="searchSubmit"
            onPress={isAIMode ? handleAISearch : () => {
              applyFilters(searchQuery, filters);
              setShowLocationPicker(false);
            }}
            style={[styles.searchCTA, { backgroundColor: colors.primary }]}
            activeOpacity={0.9}
            disabled={isAIMode && parseSearchMutation.isPending}
          >
            {isAIMode ? <Wand2 size={20} color={colors.white} /> : <SearchIcon size={20} color={colors.white} />}
            <Text style={[styles.searchCTAText, { color: colors.white }]}>
              {isAIMode ? (parseSearchMutation.isPending ? "Analysing..." : "Magic Search") : t('search_properties')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Toggle Button */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'center',
            marginTop: Spacing.md,
            backgroundColor: isAIMode ? colors.primary + '20' : 'transparent',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20
          }}
          onPress={() => setIsAIMode(!isAIMode)}
        >
          <Sparkles size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
            {isAIMode ? "Switch to Classic Filters" : "Try AI Search"}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: viewFadeAnim }}>
        {viewMode === 'list' ? (
          <FlatList
            data={filteredProperties}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={columns}
            key={columns}
            contentContainerStyle={[
              styles.list,
              { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%', paddingHorizontal: contentPadding }
            ]}
            columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('search_no_properties')}</Text>

                <View style={[styles.notifyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Bell size={24} color={colors.primary} style={{ marginBottom: Spacing.sm }} />
                  <Text style={[styles.notifyTitle, { color: colors.text }]}>No matches yet?</Text>
                  <Text style={[styles.notifyDesc, { color: colors.textSecondary }]}>
                    Save this search and we&apos;ll notify you when a property becomes available.
                  </Text>
                  <TouchableOpacity
                    style={[styles.notifyButton, { backgroundColor: colors.primary }]}
                    onPress={handleSaveSearch}
                    disabled={saveIntentMutation.isPending}
                  >
                    <Text style={[styles.notifyButtonText, { color: colors.white }]}>
                      {saveIntentMutation.isPending ? "Saving..." : "Notify Me"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        ) : (
          <View style={{ flex: 1, paddingHorizontal: isDesktop ? contentPadding : 0, maxWidth: maxContentWidth, width: '100%', alignSelf: 'center' }}>
            <PropertyMap properties={filteredProperties} />
          </View>
        )}
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: floatingButtonScale }], position: 'absolute', bottom: insets.bottom + Spacing.xl + (isTablet || isDesktop ? 0 : 50), alignSelf: 'center', left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.text }]}
          onPress={() => setViewMode((m) => (m === 'list' ? 'map' : 'list'))}
          onPressIn={() => Animated.spring(floatingButtonScale, { toValue: 0.94, useNativeDriver: true, speed: 30, bounciness: 4 }).start()}
          onPressOut={() => Animated.spring(floatingButtonScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start()}
          activeOpacity={1}
        >
          {viewMode === 'list' ? (
            <MapIcon size={20} color={colors.white} />
          ) : (
            <ListIcon size={20} color={colors.white} />
          )}
          <Text style={[styles.floatingButtonText, { color: colors.white }]}>
            {viewMode === 'list' ? t('search_map_view') : t('search_list_view')}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={showLocationPicker} animationType="fade" transparent onRequestClose={() => setShowLocationPicker(false)}>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.pickerCard, { backgroundColor: colors.surface, maxHeight: 600 }]}
          >
            <View style={{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={[styles.inputField, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, height: 44 }]}>
                <SearchIcon size={18} color={colors.textSecondary} style={{ marginRight: Spacing.xs }} />
                <TextInput
                  style={[styles.inputFieldText, { color: colors.text }]}
                  placeholder={t('search_location')}
                  placeholderTextColor={colors.textSecondary}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                  autoFocus
                />
                {locationSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setLocationSearch('')}>
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredLocations.length === 0 ? (
                <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>No locations found</Text>
                </View>
              ) : (
                filteredLocations.map((location) => (
                  <View key={location.city}>
                    <TouchableOpacity
                      style={[styles.pickerItem, { borderBottomColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => {
                        handleSelectLocation(location.city);
                        setShowLocationPicker(false);
                        setLocationSearch('');
                      }}
                    >
                      <MapPin size={16} color={colors.primary} style={{ marginRight: Spacing.xs }} />
                      <Text style={[styles.pickerText, { color: colors.text, fontWeight: '700' }]}>
                        {location.city}
                      </Text>
                    </TouchableOpacity>
                    {location.districts.map((district) => (
                      <TouchableOpacity
                        key={`${location.city}-${district}`}
                        style={[styles.pickerItem, { borderBottomColor: colors.border, paddingLeft: Spacing.xxl }]}
                        onPress={() => {
                          handleSelectLocation(location.city, district);
                          setShowLocationPicker(false);
                          setLocationSearch('');
                        }}
                      >
                        <MapPin size={14} color={colors.textSecondary} style={{ marginRight: Spacing.xs }} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pickerText, { color: colors.text }]}>
                            {district}
                          </Text>
                          <Text style={[styles.pickerSubtext, { color: colors.textSecondary }]}>
                            {location.city}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTypePicker} animationType="fade" transparent onRequestClose={() => setShowTypePicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
            {(['all', 'apartment', 'house', 'villa', 'land', 'commercial'] as const).map((type) => (
              <TouchableOpacity
                key={`type-${type}`}
                testID={`type-${type}`}
                style={[styles.pickerItem, filters.type === type ? { backgroundColor: colors.backgroundSecondary } : undefined, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowTypePicker(false);
                  handleFilterChange('type', type);
                  applyFilters(searchQuery, { ...filters, type } as Filters);
                }}
              >
                <Text style={[styles.pickerText, { color: colors.text }, filters.type === type ? { color: colors.primary, fontWeight: '700' } : undefined]}>
                  {type === 'all' ? t('search_all') : type === 'apartment' ? t('search_apartment') : type === 'house' ? t('search_house') : type === 'villa' ? t('search_villa') : type === 'land' ? t('search_land') : t('search_commercial')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showBedPicker} animationType="fade" transparent onRequestClose={() => setShowBedPicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
            {(['all', 1, 2, 3, 4, 5] as const).map((b) => (
              <TouchableOpacity
                key={`bed-${b}`}
                testID={`bed-${b}`}
                style={[styles.pickerItem, filters.bedrooms === b ? { backgroundColor: colors.backgroundSecondary } : undefined, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowBedPicker(false);
                  handleFilterChange('bedrooms', b);
                  applyFilters(searchQuery, { ...filters, bedrooms: b } as Filters);
                }}
              >
                <Text style={[styles.pickerText, { color: colors.text }, filters.bedrooms === b ? { color: colors.primary, fontWeight: '700' } : undefined]}>
                  {b === 'all' ? t('search_any') : `${b}+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showBathPicker} animationType="fade" transparent onRequestClose={() => setShowBathPicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
            {(['all', 1, 2, 3, 4] as const).map((b) => (
              <TouchableOpacity
                key={`bath-${b}`}
                testID={`bath-${b}`}
                style={[styles.pickerItem, filters.bathrooms === b ? { backgroundColor: colors.backgroundSecondary } : undefined, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowBathPicker(false);
                  handleFilterChange('bathrooms', b);
                  applyFilters(searchQuery, { ...filters, bathrooms: b } as Filters);
                }}
              >
                <Text style={[styles.pickerText, { color: colors.text }, filters.bathrooms === b ? { color: colors.primary, fontWeight: '700' } : undefined]}>
                  {b === 'all' ? t('search_any') : `${b}+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('search_filters_title')}</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('search_filter_property_type')}</Text>
                <View style={styles.filterOptions}>
                  {(['all', 'apartment', 'house', 'villa', 'land', 'commercial'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                        filters.type === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => handleFilterChange('type', type)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: colors.text },
                          filters.type === type && { color: colors.white },
                        ]}
                      >
                        {type === 'all' ? t('search_all') : type === 'apartment' ? t('search_apartment') : type === 'house' ? t('search_house') : type === 'villa' ? t('search_villa') : type === 'land' ? t('search_land') : t('search_commercial')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('search_filter_status')}</Text>
                <View style={styles.filterOptions}>
                  {(['all', 'sale', 'rent'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterOption,
                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                        filters.status === status && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => handleFilterChange('status', status)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: colors.text },
                          filters.status === status && { color: colors.white },
                        ]}
                      >
                        {status === 'all' ? t('search_all') : status === 'sale' ? t('search_sale') : t('search_rent')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('search_filter_bedrooms')}</Text>
                <View style={styles.filterOptions}>
                  {(['all', 1, 2, 3, 4, 5] as const).map((bedrooms) => (
                    <TouchableOpacity
                      key={bedrooms}
                      style={[
                        styles.filterOption,
                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                        filters.bedrooms === bedrooms && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => handleFilterChange('bedrooms', bedrooms)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: colors.text },
                          filters.bedrooms === bedrooms && { color: colors.white },
                        ]}
                      >
                        {bedrooms === 'all' ? t('search_filter_all_fem') : `${bedrooms}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('search_filter_bathrooms')}</Text>
                <View style={styles.filterOptions}>
                  {(['all', 1, 2, 3, 4] as const).map((bathrooms) => (
                    <TouchableOpacity
                      key={bathrooms}
                      style={[
                        styles.filterOption,
                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                        filters.bathrooms === bathrooms && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => handleFilterChange('bathrooms', bathrooms)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: colors.text },
                          filters.bathrooms === bathrooms && { color: colors.white },
                        ]}
                      >
                        {bathrooms === 'all' ? t('search_filter_all_fem') : `${bathrooms}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleResetFilters}
              >
                <Text style={[styles.resetButtonText, { color: colors.text }]}>{t('search_reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={handleApplyFilters}
              >
                <Text style={[styles.applyButtonText, { color: colors.white }]}>{t('search_apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  card: {
    borderRadius: 24,
    padding: Spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    alignSelf: 'center',
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputsContainer: {
    marginBottom: Spacing.md,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  mobileInputsColumn: {
    gap: Spacing.md,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md + 4,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputFieldText: {
    ...Typography.body,
    flex: 1,
    paddingVertical: 0,
    outlineStyle: 'none' as any,
  },
  inputFieldPrefix: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: 16,
    paddingHorizontal: Spacing.md + 2,
    height: 56,
  },
  inputPillText: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 0,
    outlineStyle: 'none' as any,
  },
  inputPillValue: {
    flex: 1,
    ...Typography.body,
  },
  inputPillPrefix: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 0,
  },
  searchCTA: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xxl,
    borderRadius: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginTop: Spacing.lg,
  },
  searchCTAText: {
    ...Typography.body,
    fontWeight: '600' as const,
  },
  list: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  columnWrapper: {
    gap: Spacing.xs,
  },
  gridItem: {
    paddingHorizontal: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  notifyCard: {
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notifyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  notifyDesc: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  notifyButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
  },
  notifyButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  filterSection: {
    paddingVertical: Spacing.lg,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: Spacing.md,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  applyButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  pickerText: {
    fontSize: 16,
  },
  pickerSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  floatingButton: {
    paddingHorizontal: Spacing.xl + 4,
    paddingVertical: Spacing.md + 2,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.34,
    shadowRadius: 12,
    elevation: 10,
  },
  floatingButtonText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  suggestionsContainer: {
    marginTop: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md + 2,
    gap: Spacing.sm + 2,
    borderBottomWidth: 1,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  suggestionSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  closePickerButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  closePickerText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});