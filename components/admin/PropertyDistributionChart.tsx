import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

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
  title = 'Property Distribution',
  subtitle = 'By property type · Q2 2026',
  themeMode = 'dark',
}: PropertyDistributionChartProps) {
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

  const isDark = themeMode === 'dark';
  const cardGradient = isDark ? ['#0D1527', '#111C35'] as const : ['#FFFFFF', '#F8FAFC'] as const;
  const cardBorder = isDark ? '#1E293B' : Colors.border;
  const titleColor = isDark ? '#FFFFFF' : Colors.text;
  const subtitleColor = isDark ? '#64748B' : Colors.textSecondary;

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
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        </View>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
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
                  stroke="#FFFFFF"
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
                {activeItem.type}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Screenshot-aligned highlighted footer */}
      <View style={styles.footerHighlight}>
        <View style={styles.footerLeft}>
          <View style={[styles.footerDot, { backgroundColor: activeItem?.color || '#3B82F6' }]} />
          <Text style={[styles.footerLabel, { color: titleColor }]}>
            {activeItem?.type || 'Villas'}
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
                  paddingHorizontal: isSelected ? 8 : 0,
                  paddingVertical: 4,
                  borderRadius: 8,
                },
              ]}
              onPress={() => setActiveItem(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: titleColor, fontWeight: isSelected ? '600' : '400' }]}>
                {item.type}
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
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
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
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
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
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '600',
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
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
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
    fontSize: 15,
    fontWeight: '600',
  },
  footerPercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  legend: {
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 14,
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
