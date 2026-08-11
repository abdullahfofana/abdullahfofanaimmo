import { router } from 'expo-router';
import { Heart, MapPin, Bed, Bath, Maximize2, ArrowUpRight, Sparkles } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
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
  const { t } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isHovered, setIsHovered] = useState(false);
  const [isHeartHovered, setIsHeartHovered] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} Mrd`;
      return `${(price / 1_000_000).toFixed(1)} M`;
    }
    return `${price.toLocaleString()}`;
  };

  const handleFavorite = (e: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
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
  const statusLabel = isForSale ? t('property_card_sale') : t('property_card_rent');

  return (
    <TouchableOpacity
      // @ts-ignore
      className="immoci-property-card immoci-card-animate"
      // @ts-ignore
      dataSet={{ class: 'immoci-property-card immoci-card-animate' }}
      style={[
        styles.container,
        isHovered && styles.containerHovered,
      ]}
      onPress={handlePress}
      activeOpacity={0.92}
      // @ts-ignore Web hover event handlers
      onMouseEnter={() => setIsHovered(true)}
      // @ts-ignore Web hover event handlers
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── IMAGE WRAPPER WITH MOTION ZOOM ────────────────────── */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: property.images[0] }}
          // @ts-ignore
          className="immoci-card-image"
          // @ts-ignore
          dataSet={{ class: 'immoci-card-image' }}
          style={[
            styles.image,
            isHovered && styles.imageHovered,
          ]}
          resizeMode="cover"
        />

        {/* Ambient Top Vignette (for high badge contrast) */}
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'transparent']}
          style={styles.topVignette}
        />

        {/* Cinematic Bottom Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(10,20,15,0.65)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* ── STATUS PILL (Glassmorphism + Glowing Pulse Dot) ──── */}
        <View style={[styles.statusPill, isForSale ? styles.statusPillSale : styles.statusPillRent]}>
          <View
            // @ts-ignore
            className={isForSale ? "immoci-dot-sale" : "immoci-dot-rent"}
            // @ts-ignore
            dataSet={{ class: isForSale ? "immoci-dot-sale" : "immoci-dot-rent" }}
            style={[styles.statusDot, isForSale ? styles.statusDotSale : styles.statusDotRent]}
          />
          <Text style={[styles.statusText, isForSale ? styles.statusTextSale : styles.statusTextRent]}>
            {statusLabel}
          </Text>
        </View>

        {/* ── FAVORITE BUTTON (Micro-Interactive Frosted Glass) ── */}
        <TouchableOpacity
          // @ts-ignore
          className="immoci-favorite-btn"
          // @ts-ignore
          dataSet={{ class: 'immoci-favorite-btn' }}
          style={[
            styles.favoriteBtn,
            favorite && styles.favoriteBtnActive,
            isHeartHovered && styles.favoriteBtnHovered,
          ]}
          onPress={handleFavorite}
          // @ts-ignore
          onMouseEnter={() => setIsHeartHovered(true)}
          // @ts-ignore
          onMouseLeave={() => setIsHeartHovered(false)}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          activeOpacity={0.8}
        >
          <Heart
            size={16}
            color={favorite ? '#EF4444' : '#FFFFFF'}
            fill={favorite ? '#EF4444' : 'transparent'}
            strokeWidth={2.4}
          />
        </TouchableOpacity>

        {/* ── FEATURED BADGE (Gold Shimmer Gradient) ──────────── */}
        {property.isFeatured && (
          <View
            // @ts-ignore
            className="immoci-featured-shimmer"
            // @ts-ignore
            dataSet={{ class: 'immoci-featured-shimmer' }}
            style={styles.featuredBadgeWrapper}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredBadgeGradient}
            >
              <Sparkles size={10} color="#FFFFFF" />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </LinearGradient>
          </View>
        )}

        {/* ── QUICK VIEW / ARROW FLOATING PILL (Reveals on Hover) ── */}
        {Platform.OS === 'web' && (
          <View
            // @ts-ignore
            className="immoci-hover-pill"
            // @ts-ignore
            dataSet={{ class: 'immoci-hover-pill' }}
            style={[
              styles.hoverActionPill,
              isHovered && { opacity: 1, transform: [{ translateY: 0 }] }
            ]}
          >
            <Text style={styles.hoverActionText}>
              {t('home_see_all') || 'View'}
            </Text>
            <ArrowUpRight size={13} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        )}
      </View>

      {/* ── CONTENT BODY ───────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(property.price, property.currency)}
            <Text style={styles.priceCurrency}> FCFA</Text>
          </Text>
          {property.status === 'rent' && (
            <Text style={styles.priceUnit}> / mo</Text>
          )}
        </View>

        {/* Title */}
        <Text
          // @ts-ignore
          className="immoci-card-title"
          // @ts-ignore
          dataSet={{ class: 'immoci-card-title' }}
          style={[styles.title, isHovered && styles.titleHovered]}
          numberOfLines={1}
        >
          {property.title}
        </Text>

        {/* Location Row */}
        <View style={styles.locationRow}>
          <View style={styles.mapPinBadge}>
            <MapPin size={12} color={colors.primary} strokeWidth={2.4} />
          </View>
          <Text style={styles.locationText} numberOfLines={1}>
            {property.location.district}, {property.location.city}
          </Text>
        </View>

        {/* Specs Divider & Chips */}
        <View style={styles.specsDivider} />
        <View style={styles.specsRow}>
          {!!property.bedrooms && (
            <View style={styles.specChip}>
              <Bed size={13} color={colors.primary} strokeWidth={2} />
              <Text style={styles.specText}>
                {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
              </Text>
            </View>
          )}
          {!!property.bathrooms && (
            <View style={styles.specChip}>
              <Bath size={13} color={colors.primary} strokeWidth={2} />
              <Text style={styles.specText}>{property.bathrooms} bath</Text>
            </View>
          )}
          <View style={styles.specChip}>
            <Maximize2 size={13} color={colors.primary} strokeWidth={2} />
            <Text style={styles.specText}>{property.area} m²</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  // ── Card Shell (Figma Elevation & Transitions) ───────────────────
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(10,25,18,0.12)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 18,
      },
      android: { elevation: 4 },
      web: {
        // @ts-ignore
        boxShadow: '0 4px 20px rgba(10,25,18,0.06)',
        // @ts-ignore
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      },
    }),
  },
  containerHovered: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    ...Platform.select({
      web: {
        // @ts-ignore
        transform: 'translateY(-8px)',
        // @ts-ignore
        boxShadow: '0 24px 44px -8px rgba(6, 78, 59, 0.16), 0 12px 20px -6px rgba(0, 0, 0, 0.08)',
      },
    }),
  },

  // ── Image Container & Zoom Effect ────────────────────────────────
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  image: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        // @ts-ignore
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  imageHovered: {
    ...Platform.select({
      web: {
        // @ts-ignore
        transform: 'scale(1.08)',
      },
    }),
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
  },

  // ── Status Pill (Glassmorphism) ──────────────────────────────────
  statusPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      web: {
        // @ts-ignore
        backdropFilter: 'blur(12px)',
      },
    }),
  },
  statusPillSale: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusPillRent: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotSale: {
    backgroundColor: '#10B981',
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0 0 8px #10B981',
      },
    }),
  },
  statusDotRent: {
    backgroundColor: '#2563EB',
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0 0 8px #2563EB',
      },
    }),
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statusTextSale: {
    color: '#059669',
  },
  statusTextRent: {
    color: '#1D4ED8',
  },

  // ── Favorite Button ──────────────────────────────────────────────
  favoriteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    ...Platform.select({
      web: {
        // @ts-ignore
        backdropFilter: 'blur(8px)',
        // @ts-ignore
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  favoriteBtnHovered: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
    ...Platform.select({
      web: {
        // @ts-ignore
        transform: 'scale(1.15)',
      },
    }),
  },
  favoriteBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },

  // ── Featured Shimmer Badge ───────────────────────────────────────
  featuredBadgeWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
      },
    }),
  },
  featuredBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  // ── Quick Hover Action Pill ──────────────────────────────────────
  hoverActionPill: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0 4px 14px rgba(6, 78, 59, 0.4)',
        // @ts-ignore
        animation: 'fadeIn 0.2s ease',
      },
    }),
  },
  hoverActionText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Card Content Body ────────────────────────────────────────────
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: 6,
  },

  // ── Price ────────────────────────────────────────────────────────
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },

  // ── Title ────────────────────────────────────────────────────────
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 21,
    ...Platform.select({
      web: {
        // @ts-ignore
        transition: 'color 0.2s ease',
      },
    }),
  },
  titleHovered: {
    color: colors.primary,
  },

  // ── Location ─────────────────────────────────────────────────────
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  mapPinBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(6, 78, 59, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '500' as const,
    flex: 1,
  },

  // ── Specs Divider & Chips ────────────────────────────────────────
  specsDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  specText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600' as const,
  },
});

