import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface PropertyDistributionItem {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface PropertyDistributionChartProps {
  data?: PropertyDistributionItem[];
  title?: string;
  subtitle?: string;
  themeMode?: 'dark' | 'light' | 'auto';
}

const defaultData: PropertyDistributionItem[] = [
  { type: 'Villas', count: 450, percentage: 36, color: '#F59E0B' },
  { type: 'Land', count: 387, percentage: 31, color: '#10B981' },
  { type: 'Commercial', count: 225, percentage: 18, color: '#3B82F6' },
  { type: 'Apartments', count: 188, percentage: 15, color: '#8B5CF6' },
];

export default function PropertyDistributionChart({
  data = defaultData,
  title,
  subtitle,
  themeMode = 'dark',
}: PropertyDistributionChartProps) {
  const { t } = useLanguage();
  const displayTitle = title || t('admin_property_distribution');
  const displaySubtitle = subtitle || t('admin_by_property_type');

  const [activeItem, setActiveItem] = useState<PropertyDistributionItem>(data[0]);

  const chartSize = Math.min(SCREEN_WIDTH - 80, 240);
  const center = chartSize / 2;
  const outerRadius = chartSize / 2 - 12;
  const innerRadius = outerRadius - 32;

  const totalRaw = useMemo(() => data.reduce((sum, item) => sum + (item.count || item.percentage), 0), [data]);

  const segmentsWithArcs = useMemo(() => {
    let currentAngle = 40;
    return data.map((item) => {
      const percentage = totalRaw > 0 ? ((item.count || item.percentage) / totalRaw) * 100 : item.percentage;
      const angleSpan = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;

      return {
        ...item,
        percentage: Math.round(percentage * 10) / 10,
        startAngle,
        endAngle,
      };
    });
  }, [data, totalRaw]);

  const createArcPath = (
    startAngleDeg: number,
    endAngleDeg: number,
    rOuter: number,
    rInner: number,
    cx: number,
    cy: number
  ) => {
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const startRad = toRad(startAngleDeg);
    const endRad = toRad(endAngleDeg);

    const x1Outer = cx + rOuter * Math.cos(startRad);
    const y1Outer = cy + rOuter * Math.sin(startRad);
    const x2Outer = cx + rOuter * Math.cos(endRad);
    const y2Outer = cy + rOuter * Math.sin(endRad);

    const x1Inner = cx + rInner * Math.cos(endRad);
    const y1Inner = cy + rInner * Math.sin(endRad);
    const x2Inner = cx + rInner * Math.cos(startRad);
    const y2Inner = cy + rInner * Math.sin(startRad);

    const largeArcFlag = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

    return [
      `M ${x1Outer} ${y1Outer}`,
      `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}`,
      'Z',
    ].join(' ');
  };

  const getTranslatedType = (typeStr: string) => {
    const lower = typeStr.toLowerCase();
    if (lower.includes('villa')) return t('admin_villas') || 'Villas';
    if (lower.includes('land') || lower.includes('terrain')) return t('admin_land') || 'Land';
    if (lower.includes('comm')) return t('admin_commercial') || 'Commercial';
    if (lower.includes('appart') || lower.includes('apart')) return t('admin_apartments') || 'Apartments';
    return typeStr;
  };

  const isDark = themeMode === 'dark';
  const cardGradient = isDark ? (['#0F172A', '#161F30'] as const) : (['#FFFFFF', '#FFFFFF'] as const);
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const titleColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtitleColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <LinearGradient
      colors={cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor: cardBorder }]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>📊</Text>
          <Text style={[styles.title, { color: titleColor }]}>{displayTitle}</Text>
        </View>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>{displaySubtitle}</Text>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize}>
          <G>
            {segmentsWithArcs.map((item) => {
              const isSelected = activeItem?.type === item.type;
              const curOuter = isSelected ? outerRadius + 3 : outerRadius;
              const curInner = isSelected ? innerRadius - 1 : innerRadius;
              const pathD = createArcPath(
                item.startAngle,
                item.endAngle,
                curOuter,
                curInner,
                center,
                center
              );

              return (
                <Path
                  key={item.type}
                  d={pathD}
                  fill={item.color}
                  stroke={isDark ? '#161F30' : '#FFFFFF'}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  opacity={isSelected ? 1.0 : activeItem ? 0.88 : 1.0}
                  onPress={() => setActiveItem(item)}
                />
              );
            })}
          </G>
        </Svg>

        <View
          style={[
            styles.centerInfo,
            {
              width: innerRadius * 1.8,
              height: innerRadius * 1.8,
              borderRadius: innerRadius,
            },
          ]}
          pointerEvents="none"
        >
          {activeItem && (
            <>
              <Text style={[styles.centerValue, { color: activeItem.color }]}>
                {activeItem.percentage}%
              </Text>
              <Text style={[styles.centerLabel, { color: subtitleColor }]} numberOfLines={1}>
                {getTranslatedType(activeItem.type)}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Highlighted footer */}
      <View style={[styles.footerHighlight, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
        <View style={styles.footerLeft}>
          <View style={[styles.footerDot, { backgroundColor: activeItem?.color || '#3B82F6' }]} />
          <Text style={[styles.footerLabel, { color: titleColor }]}>
            {getTranslatedType(activeItem?.type || 'Villas')}
          </Text>
        </View>
        <Text style={[styles.footerPercent, { color: titleColor }]}>
          {activeItem?.percentage || 36}%
        </Text>
      </View>

      {/* Legend list */}
      <View style={styles.legend}>
        {data.map((item, index) => {
          const isSelected = activeItem?.type === item.type;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.legendItem,
                {
                  backgroundColor: isSelected ? (isDark ? '#1E293B' : '#F1F5F9') : 'transparent',
                  paddingHorizontal: isSelected ? 10 : 0,
                  paddingVertical: 6,
                  borderRadius: 8,
                },
              ]}
              onPress={() => setActiveItem(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: titleColor, fontWeight: isSelected ? '700' : '500' }]}>
                {getTranslatedType(item.type)}
              </Text>
              <Text style={[styles.legendValue, { color: isDark ? '#94A3B8' : Colors.textSecondary }]}>
                {item.count ? `${item.count} · ` : ''}{item.percentage}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 20,
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500' as const,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  centerInfo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  centerLabel: {
    fontSize: 11.5,
    fontWeight: '700' as const,
    marginTop: 1,
    textAlign: 'center',
  },
  footerHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 6,
    borderBottomWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footerLabel: {
    fontSize: 14.5,
    fontWeight: '700' as const,
  },
  footerPercent: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  legend: {
    marginTop: 12,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13.5,
    flex: 1,
  },
  legendValue: {
    fontSize: 12.5,
    fontWeight: '600' as const,
  },
});
