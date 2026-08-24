import { router } from 'expo-router';
import { Heart, MapPin, Bed, Bath, Maximize2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import { Property } from '@/types/property';
import { useLanguage } from '@/providers/LanguageProvider';
import { useFavorites } from '@/providers/FavoritesProvider';

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
}

export default function PropertyCard({ property, onPress }: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(property.id);
  const { language } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isHovered, setIsHovered] = useState(false);
  const hoverAnim = React.useRef(new Animated.Value(0)).current;
  const imageScale = React.useRef(new Animated.Value(1)).current;
  const favScale = React.useRef(new Animated.Value(1)).current;

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} Mrd`;
      return `${(price / 1_000_000).toFixed(1)} M`;
    }
    return `${price.toLocaleString()}`;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    Animated.parallel([
      Animated.timing(hoverAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(imageScale, {
        toValue: 1.055,
        duration: 350,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    Animated.parallel([
      Animated.timing(hoverAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 350,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const handleFavorite = (e: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    Animated.sequence([
      Animated.timing(favScale, { toValue: 1.3, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(favScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    toggleFavorite(property.id);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/property/${property.id}`);
    }
  };

  const isForSale = property.status === 'sale';
  const statusLabel = isForSale ? (language === 'fr' ? 'À VENDRE' : 'FOR SALE') : (language === 'fr' ? 'À LOUER' : 'FOR RENT');

  const cardTranslateY = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ translateY: cardTranslateY }],
        },
      ]}
    >
      <TouchableOpacity
        // @ts-ignore
        className="immoci-property-card"
        style={[
          styles.container,
          isHovered && styles.containerHovered,
        ]}
        onPress={handlePress}
        activeOpacity={0.92}
        // @ts-ignore
        onMouseEnter={handleMouseEnter}
        // @ts-ignore
        onMouseLeave={handleMouseLeave}
      >
        {/* ── IMAGE WRAPPER ────────────────────────────────────────── */}
        <View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri: property.images[0] }}
            // @ts-ignore
            className="immoci-card-image"
            style={[
              styles.image,
              {
                transform: [{ scale: imageScale }],
              },
            ]}
            resizeMode="cover"
          />

          {/* ── TOP STATUS & BADGES ───────────────────────────────── */}
          <View style={styles.topBadgesRow}>
            <View style={[styles.statusPill, isForSale ? styles.statusPillSale : styles.statusPillRent]}>
              <Text style={styles.statusText}>
                {statusLabel}
              </Text>
            </View>

            {property.isFeatured && (
              <View style={styles.featuredPill}>
                <Text style={styles.featuredText}>
                  {language === 'fr' ? 'VEDETTE' : 'FEATURED'}
                </Text>
              </View>
            )}
          </View>

          {/* ── FAVORITE BUTTON ───────────────────────────────────── */}
          <Animated.View style={{ transform: [{ scale: favScale }] }}>
            <TouchableOpacity
              // @ts-ignore
              className="immoci-favorite-btn"
              style={[styles.favoriteBtn, favorite && styles.favoriteBtnActive]}
              onPress={handleFavorite}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.8}
            >
              <Heart
                size={16}
                color={favorite ? '#EF4444' : '#1E293B'}
                fill={favorite ? '#EF4444' : 'transparent'}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* ── BOTTOM PHOTO COUNT ────────────────────────────────── */}
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>
              📷 {property.images?.length || 1}
            </Text>
          </View>
        </View>

        {/* ── CONTENT BODY ─────────────────────────────────────────── */}
        <View style={styles.content}>
          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatPrice(property.price, property.currency)}
              <Text style={styles.priceCurrency}> FCFA</Text>
            </Text>
            {property.status === 'rent' && (
              <Text style={styles.priceUnit}> / mois</Text>
            )}
          </View>

          {/* Title */}
          <Text
            // @ts-ignore
            className="immoci-card-title"
            style={[styles.title, isHovered && styles.titleHovered]}
            numberOfLines={1}
          >
            {property.title}
          </Text>

          {/* Location Row */}
          <View style={styles.locationRow}>
            <MapPin size={13} color="#64748B" strokeWidth={2} />
            <Text style={styles.locationText} numberOfLines={1}>
              {property.location.district}, {property.location.city}
            </Text>
          </View>

          {/* Specs Row */}
          <View style={styles.specsRow}>
            {!!property.bedrooms && (
              <View style={styles.specItem}>
                <Bed size={13} color="#475569" strokeWidth={1.8} />
                <Text style={styles.specText}>
                  {property.bedrooms} {language === 'fr' ? 'ch.' : 'bd.'}
                </Text>
              </View>
            )}
            {!!property.bathrooms && (
              <View style={styles.specItem}>
                <Bath size={13} color="#475569" strokeWidth={1.8} />
                <Text style={styles.specText}>
                  {property.bathrooms} {language === 'fr' ? 'sdb.' : 'ba.'}
                </Text>
              </View>
            )}
            <View style={styles.specItem}>
              <Maximize2 size={13} color="#475569" strokeWidth={1.8} />
              <Text style={styles.specText}>{property.area} m²</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: {
        // @ts-ignore
        boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.06)',
        // @ts-ignore
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        cursor: 'pointer',
      },
    }),
  },
  containerHovered: {
    borderColor: 'rgba(5, 150, 105, 0.45)',
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0 20px 38px -10px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(5, 150, 105, 0.08)',
      },
    }),
  },
  titleHovered: {
    color: '#059669',
  },

  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  topBadgesRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  statusPillSale: {
    backgroundColor: '#059669',
  },
  statusPillRent: {
    backgroundColor: '#0284C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  featuredPill: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
      web: {
        // @ts-ignore
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  favoriteBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  photoCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  content: {
    padding: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 19,
    fontWeight: '800' as const,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#059669',
  },
  priceUnit: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 3,
  },

  title: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 19,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },

  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
});

