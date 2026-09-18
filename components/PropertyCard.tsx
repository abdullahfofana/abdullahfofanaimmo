import { router } from 'expo-router';
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Phone,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react-native';
import React, { useMemo, useState, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { IconSizes, IconStrokes } from '@/constants/icons';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import { Property } from '@/types/property';
import { useLanguage } from '@/providers/LanguageProvider';
import { useFavorites } from '@/providers/FavoritesProvider';

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
  compact?: boolean;
  showQuickActions?: boolean;
}

export default function PropertyCard({
  property,
  onPress,
  compact = false,
  showQuickActions = true,
}: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(property.id);
  const { language } = useLanguage();
  const loc = (fr: string, en: string, _ar?: string) => language === 'fr' ? fr : en;
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isHovered, setIsHovered] = useState(false);
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1)).current;

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'FCFA') {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} Mrd`;
      if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
      return `${price.toLocaleString()}`;
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
        toValue: 1.04,
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
    toggleFavorite(property.id);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/property/${property.id}`);
    }
  };

  const handleWhatsAppContact = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const phone = property.agent?.phone || '+225 07 48 22 19 00';
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone) return;
    const text = encodeURIComponent(
      loc(
        `Bonjour, je vous contacte concernant l'annonce : ${property.title} sur ImmoCI.`,
        `Hello, I'm contacting you regarding the listing: ${property.title} on ImmoCI.`)
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`).catch((err) => {
      console.warn('[WhatsApp Linking Error]:', err);
    });
  };

  const handleCallContact = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const phone = property.agent?.phone || '+225 07 48 22 19 00';
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone) return;
    Linking.openURL(`tel:${cleanPhone}`).catch((err) => {
      console.warn('[Phone Linking Error]:', err);
    });
  };

  const isForSale = property.status === 'sale';
  const statusLabel = isForSale
    ? loc('À VENDRE', 'FOR SALE')
    : loc('À LOUER', 'FOR RENT');

  const cardTranslateY = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const photoCount = property.images?.length || 1;

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
        style={[
          styles.container,
          isHovered && styles.containerHovered,
          compact && styles.containerCompact,
        ]}
        onPress={handlePress}
        activeOpacity={0.92}
        // @ts-ignore
        onMouseEnter={handleMouseEnter}
        // @ts-ignore
        onMouseLeave={handleMouseLeave}
      >
        {/* ── IMAGE WRAPPER ────────────────────────────────────────── */}
        <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
          <Animated.Image
            source={{ uri: property.images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' }}
            style={[
              styles.image,
              {
                transform: [{ scale: imageScale }],
              },
            ]}
            resizeMode="cover"
          />

          {/* Cinematic Top/Bottom Gradient Overlay */}
          <LinearGradient
            colors={['rgba(15,23,42,0.45)', 'transparent', 'rgba(15,23,42,0.55)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* ── TOP BADGES ROW ─────────────────────────────────────── */}
          <View style={styles.topBadgesRow}>
            <View style={[styles.statusPillBadge, isForSale ? styles.statusPillSale : styles.statusPillRent]}>
              <View style={styles.statusLiveDot} />
              <Text style={styles.statusPillText}>{statusLabel}</Text>
            </View>

            {/* ACD / Verified Legal Title Badge */}
            <View style={styles.acdPillBadge}>
              <CheckCircle2 size={11} color="#10B981" strokeWidth={2.5} />
              <Text style={styles.acdPillText}>ACD</Text>
            </View>

            {property.isFeatured && (
              <View style={styles.featuredPillBadge}>
                <Text style={styles.featuredPillText}>{loc('VEDETTE', 'FEATURED')}</Text>
              </View>
            )}
          </View>

          {/* ── FAVORITE BUTTON (GLASSMORPHIC CIRCLE) ──────────────── */}
          <View style={styles.favoriteBtnWrapper}>
            <TouchableOpacity
              style={[styles.favoriteBtn, favorite && styles.favoriteBtnActive]}
              onPress={handleFavorite}
              activeOpacity={0.8}
            >
              <Heart
                size={16}
                color={favorite ? '#EF4444' : '#0F172A'}
                fill={favorite ? '#EF4444' : 'transparent'}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </View>

          {/* ── BOTTOM IMAGE BADGES (Rating & Photo Count) ──────────── */}
          <View style={styles.bottomImageRow}>
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountText}>📷 {photoCount}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        </View>

        {/* ── CARD CONTENT BODY ────────────────────────────────────── */}
        <View style={[styles.content, compact && styles.contentCompact]}>
          {/* Title & Price Header Row (Reference Image Hierarchy) */}
          <View style={styles.titlePriceRow}>
            <Text
              style={[styles.title, isHovered && styles.titleHovered]}
              numberOfLines={1}
            >
              {property.title}
            </Text>
            <Text style={styles.price}>
              {formatPrice(property.price, property.currency)}
              <Text style={styles.priceCurrency}> FCFA</Text>
              {property.status === 'rent' && (
                <Text style={styles.priceUnit}>/m</Text>
              )}
            </Text>
          </View>

          {/* Location Row */}
          <View style={styles.locationRow}>
            <MapPin size={12} color="#64748B" strokeWidth={2.2} />
            <Text style={styles.locationText} numberOfLines={1}>
              {property.location.district ? `${property.location.district}, ` : ''}{property.location.city}
            </Text>
          </View>

          {/* Specs Row (Soft Squircle Chips) */}
          <View style={styles.specsRow}>
            {!!property.bedrooms && (
              <View style={styles.specChip}>
                <Bed size={13} color="#059669" strokeWidth={2.2} />
                <Text style={styles.specText}>
                  {property.bedrooms} {loc('Ch.', 'Beds')}
                </Text>
              </View>
            )}
            {!!property.bathrooms && (
              <View style={styles.specChip}>
                <Bath size={13} color="#059669" strokeWidth={2.2} />
                <Text style={styles.specText}>
                  {property.bathrooms} {loc('Sdb.', 'Baths')}
                </Text>
              </View>
            )}
            <View style={styles.specChip}>
              <Maximize2 size={13} color="#059669" strokeWidth={2.2} />
              <Text style={styles.specText}>{property.area} m²</Text>
            </View>
          </View>

          {/* ── QUICK 1-TAP CONTACT ACTION ROW ── */}
          {showQuickActions && !compact && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={handleWhatsAppContact}
                activeOpacity={0.8}
              >
                <MessageCircle size={15} color="#059669" strokeWidth={2.5} />
                <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callBtn}
                onPress={handleCallContact}
                activeOpacity={0.8}
              >
                <Phone size={14} color="#475569" strokeWidth={2.2} />
                <Text style={styles.callBtnText}>{loc('Appeler', 'Call')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailPill}
                onPress={handlePress}
                activeOpacity={0.75}
              >
                <Text style={styles.detailPillText}>
                  {loc('Détails', 'Details')}
                </Text>
                <ArrowRight size={13} color="#059669" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    cardWrapper: {
      width: '100%',
    },
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#EDEAE4',
      position: 'relative',
      marginBottom: Spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 14,
        },
        android: { elevation: 3 },
        web: {
          boxShadow: '0 6px 20px -4px rgba(15, 23, 42, 0.07)',
          cursor: 'pointer',
        },
      }),
    },
    containerHovered: {
      borderColor: 'rgba(5, 150, 105, 0.45)',
      ...Platform.select({
        web: {
          boxShadow: '0 18px 36px -6px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(5, 150, 105, 0.08)',
        },
      }),
    },
    containerCompact: {
      borderRadius: 16,
      marginBottom: 8,
    },
    titleHovered: {
      color: '#059669',
    },

    // Image
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 210,
      overflow: 'hidden',
      backgroundColor: '#F1F5F9',
    },
    imageContainerCompact: {
      height: 140,
    },
    image: {
      width: '100%',
      height: '100%',
    },

    // Badges
    topBadgesRow: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      zIndex: 10,
    },
    statusPillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statusPillSale: {
      borderColor: 'rgba(5, 150, 105, 0.2)',
    },
    statusPillRent: {
      borderColor: 'rgba(2, 132, 199, 0.2)',
    },
    statusLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#059669',
    },
    statusPillText: {
      fontSize: 10.5,
      fontWeight: '800' as const,
      color: '#0F172A',
      letterSpacing: 0.2,
    },

    acdPillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3.5,
      backgroundColor: 'rgba(15, 23, 42, 0.78)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    acdPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#10B981',
      letterSpacing: 0.3,
    },

    featuredPillBadge: {
      backgroundColor: '#D97706',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    featuredPillText: {
      fontSize: 10,
      fontWeight: '800' as const,
      color: '#FFFFFF',
      letterSpacing: 0.4,
    },

    // Favorite Button
    favoriteBtnWrapper: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 20,
    },
    favoriteBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    favoriteBtnActive: {
      backgroundColor: '#FFFFFF',
    },

    // Bottom of image
    bottomImageRow: {
      position: 'absolute',
      bottom: 10,
      left: 12,
      right: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    photoCountBadge: {
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 14,
    },
    photoCountText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    ratingStar: {
      fontSize: 11,
      color: '#F59E0B',
      fontWeight: '800',
    },
    ratingText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#0F172A',
    },

    // Body
    content: {
      padding: 16,
      paddingTop: 14,
    },
    contentCompact: {
      padding: 10,
    },
    titlePriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '800' as const,
      color: '#111827',
      flex: 1,
      letterSpacing: -0.3,
    },
    price: {
      fontSize: 17,
      fontWeight: '800' as const,
      color: '#059669',
      letterSpacing: -0.4,
    },
    priceCurrency: {
      fontSize: 12,
      fontWeight: '800' as const,
      color: '#059669',
    },
    priceUnit: {
      fontSize: 11,
      color: '#64748B',
      fontWeight: '600',
    },

    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 12,
    },
    locationText: {
      fontSize: 12.5,
      color: '#64748B',
      fontWeight: '500',
      flex: 1,
    },

    // Specs
    specsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#F4F2EC',
    },
    specChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4.5,
      backgroundColor: '#F8F9FA',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: '#EDE9E2',
    },
    specText: {
      fontSize: 11.5,
      color: '#334155',
      fontWeight: '600',
    },

    // Quick Actions Row
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#F8FAF8',
    },
    whatsAppBtn: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: 'rgba(5, 150, 105, 0.09)',
      borderWidth: 1,
      borderColor: 'rgba(5, 150, 105, 0.22)',
      paddingVertical: 8,
      borderRadius: 12,
    },
    whatsAppBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#059669',
    },
    callBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      paddingVertical: 8,
      borderRadius: 12,
    },
    callBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#475569',
    },
    detailPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    detailPillText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#059669',
    },
  });



