import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import {
  TrendingUp,
  Building,
  Home,
  Tag,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AreaPriceStats, formatPriceFCFA } from '@/utils/priceStats';
import { useLanguage } from '@/providers/LanguageProvider';

interface AreaPriceStatsCardProps {
  stats: AreaPriceStats;
  compact?: boolean;
  onExplorePress?: () => void;
  showExploreButton?: boolean;
}

export default function AreaPriceStatsCard({
  stats,
  compact = false,
  onExplorePress,
  showExploreButton = true,
}: AreaPriceStatsCardProps) {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  if (!stats.hasEnoughData) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <View style={styles.headerRow}>
          <View style={styles.areaTitleCol}>
            <View style={styles.badgeRow}>
              <View style={styles.marketBadge}>
                <Tag size={11} color="#D97706" />
                <Text style={styles.marketBadgeText}>
                  {isFr ? 'PRIX DU MARCHÉ' : 'MARKET PRICE'}
                </Text>
              </View>
              <Text style={styles.cityTag}>{stats.cityName}</Text>
            </View>
            <Text style={styles.areaName}>{stats.areaName}</Text>
          </View>
        </View>

        <View style={styles.insufficientDataBox}>
          <AlertCircle size={18} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.insufficientDataTitle}>
              {isFr ? 'Données insuffisantes' : 'Not enough data available'}
            </Text>
            <Text style={styles.insufficientDataDesc}>
              {isFr
                ? `Il n'y a actuellement que ${stats.totalCount} bien(s) répertorié(s) à ${stats.areaName}. Nous n'affichons pas de moyenne pour garantir une précision absolue.`
                : `There are currently only ${stats.totalCount} listing(s) in ${stats.areaName}. We do not show estimated averages to ensure data accuracy.`}
            </Text>
          </View>
        </View>

        {stats.totalCount > 0 && showExploreButton && (
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={onExplorePress || (() => router.push(`/(tabs)/search?location=${encodeURIComponent(stats.areaName)}`))}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreBtnText}>
              {isFr ? `Voir les ${stats.totalCount} annonce(s) à ${stats.areaName}` : `View ${stats.totalCount} listing(s) in ${stats.areaName}`}
            </Text>
            <ArrowRight size={14} color="#059669" strokeWidth={2.4} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.areaTitleCol}>
          <View style={styles.badgeRow}>
            <View style={styles.activeMarketBadge}>
              <TrendingUp size={12} color="#059669" strokeWidth={2.2} />
              <Text style={styles.activeMarketBadgeText}>
                {isFr ? 'PRIX DU MARCHÉ' : 'MARKET PRICE'}
              </Text>
            </View>
            <Text style={styles.cityTag}>{stats.cityName}</Text>
          </View>
          <Text style={styles.areaName}>{stats.areaName}</Text>
        </View>

        <View style={styles.totalCountBadge}>
          <Text style={styles.totalCountNumber}>{stats.totalCount}</Text>
          <Text style={styles.totalCountLabel}>{isFr ? 'biens vérifiés' : 'listings'}</Text>
        </View>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Average Sale Price */}
        {stats.avgSalePrice != null && (
          <View style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <Tag size={13} color="#059669" />
              <Text style={styles.statBoxLabel}>
                {isFr ? 'Prix moyen (Vente)' : 'Avg Sale Price'}
              </Text>
            </View>
            <Text style={styles.statBoxValue}>
              {formatPriceFCFA(stats.avgSalePrice)}
            </Text>
            {stats.minSalePrice != null && stats.maxSalePrice != null && (
              <Text style={styles.statRange}>
                {isFr ? 'Min ' : 'Min '}
                {formatPriceFCFA(stats.minSalePrice)} · {isFr ? 'Max ' : 'Max '}
                {formatPriceFCFA(stats.maxSalePrice)}
              </Text>
            )}
          </View>
        )}

        {/* Average Rent Price */}
        {stats.avgRentPrice != null && (
          <View style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <Home size={13} color="#2563EB" />
              <Text style={styles.statBoxLabel}>
                {isFr ? 'Loyer moyen (Location)' : 'Avg Rent Price'}
              </Text>
            </View>
            <Text style={[styles.statBoxValue, { color: '#2563EB' }]}>
              {formatPriceFCFA(stats.avgRentPrice, true)}
            </Text>
            {stats.minRentPrice != null && stats.maxRentPrice != null && (
              <Text style={styles.statRange}>
                {isFr ? 'Min ' : 'Min '}
                {formatPriceFCFA(stats.minRentPrice, true)} · {isFr ? 'Max ' : 'Max '}
                {formatPriceFCFA(stats.maxRentPrice, true)}
              </Text>
            )}
          </View>
        )}

        {/* Price per m² */}
        {stats.avgPricePerM2 != null && (
          <View style={styles.statBox}>
            <View style={styles.statBoxHeader}>
              <Layers size={13} color="#D97706" />
              <Text style={styles.statBoxLabel}>
                {isFr ? 'Prix moyen au m²' : 'Avg Price / m²'}
              </Text>
            </View>
            <Text style={[styles.statBoxValue, { color: '#D97706' }]}>
              {stats.avgPricePerM2.toLocaleString('fr-FR')} FCFA / m²
            </Text>
            <Text style={styles.statRange}>
              {isFr ? 'Basé sur les ventes avec superficie' : 'Based on listings with verified surface'}
            </Text>
          </View>
        )}
      </View>

      {/* Type breakdown pills */}
      {stats.typeBreakdown.length > 0 && !compact && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownTitle}>
            {isFr ? 'Disponibilité par type :' : 'By property type:'}
          </Text>
          <View style={styles.breakdownPills}>
            {stats.typeBreakdown.map((item) => (
              <View key={item.type} style={styles.typePill}>
                <Text style={styles.typePillText}>
                  {item.type === 'villa' ? '🏖️ Villas' : item.type === 'apartment' ? '🏢 Apparts' : item.type === 'house' ? '🏡 Maisons' : item.type === 'land' ? '🌿 Terrains' : '🏬 Pro'} : <Text style={{ fontWeight: '800', color: '#0F172A' }}>{item.count}</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Explore Button */}
      {showExploreButton && (
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={onExplorePress || (() => router.push(`/(tabs)/search?location=${encodeURIComponent(stats.areaName)}`))}
          activeOpacity={0.85}
        >
          <Text style={styles.exploreBtnText}>
            {isFr ? `Explorer tous les biens à ${stats.areaName}` : `Explore all properties in ${stats.areaName}`}
          </Text>
          <ArrowRight size={14} color="#059669" strokeWidth={2.4} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 16,
  },
  compactCard: {
    padding: 12,
    borderRadius: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFBEB',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  areaTitleCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  marketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  marketBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  activeMarketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeMarketBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  cityTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  areaName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  totalCountBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  totalCountNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  totalCountLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2,
  },
  statRange: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },

  // Breakdown
  breakdownRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  breakdownPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typePillText: {
    fontSize: 11,
    color: '#475569',
  },

  // Insufficient Data
  insufficientDataBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  insufficientDataTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  insufficientDataDesc: {
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 16,
  },

  // Explore Button
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  exploreBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#059669',
  },
});
