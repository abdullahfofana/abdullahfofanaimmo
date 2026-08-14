import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardDark, dashboardLight } from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface PerformanceSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  count?: number;
  description?: string;
}

export interface PerformanceDistributionChartProps {
  title?: string;
  subtitle?: string;
  data?: PerformanceSegment[];
  size?: number;
  donutThickness?: number;
  themeMode?: 'dark' | 'light' | 'auto';
  showDetailsToggle?: boolean;
  onSelectSegment?: (segment: PerformanceSegment) => void;
  periods?: string[];
  activePeriod?: string;
  onPeriodChange?: (period: string) => void;
  style?: object;
}

export const DEFAULT_PERFORMANCE_DATA: PerformanceSegment[] = [
  {
    id: 'exceptional',
    label: 'Exceptional',
    value: 12,
    color: '#3B82F6',
    count: 48,
    description: 'Top tier consistency & high revenue volume',
  },
  {
    id: 'needs_focus',
    label: 'Needs Focus',
    value: 5,
    color: '#64748B',
    count: 20,
    description: 'Moderate progress, requires optimization',
  },
  {
    id: 'underperforming',
    label: 'Underperforming',
    value: 10,
    color: '#EF4444',
    count: 40,
    description: 'Below quarterly targets & SLA requirements',
  },
  {
    id: 'satisfactory',
    label: 'Satisfactory',
    value: 45,
    color: '#F59E0B',
    count: 180,
    description: 'Consistently hitting expected milestones',
  },
  {
    id: 'outstanding',
    label: 'Outstanding',
    value: 28,
    color: '#10B981',
    count: 112,
    description: 'Above targets with high client satisfaction',
  },
];

export default function PerformanceDistributionChart({
  title,
  subtitle = 'Q2 2026',
  data = DEFAULT_PERFORMANCE_DATA,
  size,
  donutThickness = 32,
  themeMode = 'dark',
  showDetailsToggle = true,
  onSelectSegment,
  periods = ['Q2 2026', 'Q1 2026', '2025', 'All-Time'],
  activePeriod: controlledPeriod,
  onPeriodChange,
  style,
}: PerformanceDistributionChartProps) {
  const { t, language } = useLanguage();
  const displayTitle = title || t('admin_performance_distribution');

  const [selectedPeriod, setSelectedPeriod] = useState(controlledPeriod || subtitle);
  const [activeSegmentId, setActiveSegmentId] = useState<string>('exceptional');

  const isDark = themeMode === 'dark';

  const chartSize = useMemo(() => {
    if (size) return size;
    const available = Math.min(SCREEN_WIDTH - 64, 320);
    return Math.max(220, Math.min(available, 260));
  }, [size]);

  const center = chartSize / 2;
  const outerRadius = chartSize / 2 - 16;
  const innerRadius = Math.max(outerRadius - donutThickness, 35);

  const totalRaw = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const totalCount = useMemo(() => data.reduce((sum, item) => sum + (item.count || 0), 0), [data]);

  const getTranslatedLabel = (id: string, defaultLabel: string) => {
    switch (id) {
      case 'exceptional':
        return t('admin_exceptional') || defaultLabel;
      case 'needs_focus':
        return t('admin_needs_focus') || defaultLabel;
      case 'underperforming':
        return t('admin_underperforming') || defaultLabel;
      case 'satisfactory':
        return t('admin_satisfactory') || defaultLabel;
      case 'outstanding':
        return t('admin_outstanding') || defaultLabel;
      default:
        return defaultLabel;
    }
  };

  const segmentsWithArcs = useMemo(() => {
    let currentAngle = 35;
    return data.map((item) => {
      const percentage = totalRaw > 0 ? (item.value / totalRaw) * 100 : 0;
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

  const activeSegment = useMemo(() => {
    return (
      segmentsWithArcs.find((s) => s.id === activeSegmentId) ||
      segmentsWithArcs[0] ||
      null
    );
  }, [segmentsWithArcs, activeSegmentId]);

  const handleSelect = (segment: PerformanceSegment) => {
    setActiveSegmentId(segment.id);
    if (onSelectSegment) {
      onSelectSegment(segment);
    }
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

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

  const theme = isDark ? dashboardDark : dashboardLight;
  const cardGradient = isDark ? (['#0F172A', '#161F30'] as const) : (['#FFFFFF', '#FFFFFF'] as const);
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const titleColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtitleColor = isDark ? '#94A3B8' : '#64748B';
  const sliceStroke = isDark ? '#161F30' : '#FFFFFF';
  const pillBg = isDark ? '#1E293B' : '#F1F5F9';

  return (
    <LinearGradient
      colors={cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: cardBorder }, style]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: titleColor }]}>{displayTitle}</Text>
          <View style={styles.subtitleRow}>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>{selectedPeriod}</Text>
            {periods.length > 1 && (
              <View style={styles.periodPillRow}>
                {periods.map((p) => {
                  const isActive = p === selectedPeriod;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => handlePeriodSelect(p)}
                      style={[
                        styles.periodPill,
                        { backgroundColor: isActive ? '#3B82F6' : pillBg },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.periodPillText,
                          { color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Donut Chart Container ── */}
      <View style={styles.chartWrapper}>
        <Svg width={chartSize} height={chartSize}>
          <G>
            {segmentsWithArcs.map((segment) => {
              const isSelected = activeSegment?.id === segment.id;
              const curOuter = isSelected ? outerRadius + 3 : outerRadius;
              const curInner = isSelected ? innerRadius - 1 : innerRadius;
              const pathD = createArcPath(
                segment.startAngle,
                segment.endAngle,
                curOuter,
                curInner,
                center,
                center
              );

              return (
                <Path
                  key={segment.id}
                  d={pathD}
                  fill={segment.color}
                  stroke={sliceStroke}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  opacity={isSelected ? 1.0 : activeSegment ? 0.88 : 1.0}
                  onPress={() => handleSelect(segment)}
                />
              );
            })}
          </G>
        </Svg>

        {/* Center cutout info */}
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
          {activeSegment && (
            <>
              <Text
                style={[
                  styles.centerValue,
                  { color: activeSegment.color },
                ]}
                numberOfLines={1}
              >
                {activeSegment.value}%
              </Text>
              <Text
                style={[
                  styles.centerLabel,
                  { color: subtitleColor },
                ]}
                numberOfLines={1}
              >
                {getTranslatedLabel(activeSegment.id, activeSegment.label)}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── Bottom Reference Row ── */}
      <View style={[styles.footerRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
        <View style={styles.activeLegendLeft}>
          <View
            style={[
              styles.bulletDot,
              { backgroundColor: activeSegment?.color || '#3B82F6' },
            ]}
          />
          <Text style={[styles.activeLegendLabel, { color: titleColor }]}>
            {activeSegment ? getTranslatedLabel(activeSegment.id, activeSegment.label) : 'Exceptional'}
          </Text>
        </View>

        <Text style={[styles.activeLegendValue, { color: titleColor }]}>
          {activeSegment ? `${activeSegment.value}%` : '12%'}
        </Text>
      </View>

      {/* ── Segment Selector Chips ── */}
      {showDetailsToggle && (
        <View style={styles.segmentChipsContainer}>
          {segmentsWithArcs.map((item) => {
            const isSelected = activeSegment?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.segmentChip,
                  {
                    backgroundColor: isSelected ? (isDark ? '#1E293B' : '#EFF6FF') : pillBg,
                    borderColor: isSelected ? item.color : 'transparent',
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.chipDot, { backgroundColor: item.color }]} />
                <Text
                  style={[
                    styles.chipLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {getTranslatedLabel(item.id, item.label)}
                </Text>
                <Text style={[styles.chipPercent, { color: item.color }]}>
                  {item.value}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Summary KPI Footer ── */}
      {totalCount > 0 && (
        <View style={[styles.kpiFooter, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: subtitleColor }]}>
              {language === 'fr' ? 'Total Surveillé' : 'Total Units'}
            </Text>
            <Text style={[styles.kpiValue, { color: titleColor }]}>{totalCount}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: subtitleColor }]}>
              {language === 'fr' ? 'Top Rangs' : 'Top Performers'}
            </Text>
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>
              {((segmentsWithArcs.find(s => s.id === 'exceptional')?.value || 0) +
                (segmentsWithArcs.find(s => s.id === 'outstanding')?.value || 0))}%
            </Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: subtitleColor }]}>
              {language === 'fr' ? 'Croissance' : 'Benchmark'}
            </Text>
            <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>+14.2% YoY</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  titleWrap: {
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500' as const,
  },
  periodPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  periodPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  chartWrapper: {
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
    fontSize: 11,
    fontWeight: '700' as const,
    marginTop: 1,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginTop: 6,
  },
  activeLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeLegendLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  activeLegendValue: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  segmentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 11.5,
  },
  chipPercent: {
    fontSize: 11.5,
    fontWeight: '700' as const,
  },
  kpiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  kpiCol: {
    alignItems: 'center',
    flex: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  kpiDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
});
