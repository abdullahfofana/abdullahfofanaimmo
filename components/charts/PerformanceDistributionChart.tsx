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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface PerformanceSegment {
  id: string;
  label: string;
  value: number; // percentage (0-100)
  color: string;
  count?: number;
  description?: string;
}

export interface PerformanceDistributionChartProps {
  title?: string;
  subtitle?: string;
  data?: PerformanceSegment[];
  size?: number; // Outer diameter of chart
  donutThickness?: number; // Thickness of the ring
  themeMode?: 'dark' | 'light' | 'auto';
  showDetailsToggle?: boolean;
  onSelectSegment?: (segment: PerformanceSegment) => void;
  periods?: string[];
  activePeriod?: string;
  onPeriodChange?: (period: string) => void;
  style?: object;
}

// Default dataset strictly aligned with the reference image:
// 1. Blue (Exceptional) - ~12% (top-right)
// 2. Slate (Needs Focus) - ~5% (middle-right)
// 3. Red (Underperforming) - ~10% (bottom-right)
// 4. Amber/Orange (Satisfactory) - ~45% (bottom & left, largest)
// 5. Green (Outstanding) - ~28% (top-left)
export const DEFAULT_PERFORMANCE_DATA: PerformanceSegment[] = [
  {
    id: 'exceptional',
    label: 'Exceptional',
    value: 12,
    color: '#3B82F6', // Vibrant Blue
    count: 48,
    description: 'Top tier consistency & high revenue volume',
  },
  {
    id: 'needs_focus',
    label: 'Needs Focus',
    value: 5,
    color: '#64748B', // Slate Grey
    count: 20,
    description: 'Moderate progress, requires optimization',
  },
  {
    id: 'underperforming',
    label: 'Underperforming',
    value: 10,
    color: '#EF4444', // Coral Red
    count: 40,
    description: 'Below quarterly targets & SLA requirements',
  },
  {
    id: 'satisfactory',
    label: 'Satisfactory',
    value: 45,
    color: '#F59E0B', // Amber / Warm Orange
    count: 180,
    description: 'Consistently hitting expected milestones',
  },
  {
    id: 'outstanding',
    label: 'Outstanding',
    value: 28,
    color: '#10B981', // Emerald Green
    count: 112,
    description: 'Above targets with high client satisfaction',
  },
];

export default function PerformanceDistributionChart({
  title = 'Performance Distribution',
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
  const [selectedPeriod, setSelectedPeriod] = useState(controlledPeriod || subtitle);
  const [activeSegmentId, setActiveSegmentId] = useState<string>('exceptional');

  const isDark = themeMode === 'dark';

  // Responsive chart sizing: compact on mobile, spacious on web/desktop
  const chartSize = useMemo(() => {
    if (size) return size;
    const available = Math.min(SCREEN_WIDTH - 64, 320);
    return Math.max(220, Math.min(available, 260));
  }, [size]);

  const center = chartSize / 2;
  const outerRadius = chartSize / 2 - 16;
  const innerRadius = Math.max(outerRadius - donutThickness, 35);

  // Normalize data percentages so sum equals 100
  const totalRaw = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const totalCount = useMemo(() => data.reduce((sum, item) => sum + (item.count || 0), 0), [data]);

  // Compute angles for each segment
  // In the reference screenshot, Blue (Exceptional) starts around ~35° (just past top)
  const segmentsWithArcs = useMemo(() => {
    let currentAngle = 35; // Start in top-right quadrant matching reference screenshot
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

  // Active segment object
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

  // Helper function to build SVG donut slice path
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

  const cardGradient = theme.gradient.card;
  const cardBorder = theme.borderLight;
  const titleColor = theme.text;
  const subtitleColor = theme.textSecondary;
  const sliceStroke = theme.surface;
  const pillBg = theme.surfaceAlt;
  const pillActiveBg = theme.surfaceElevated;

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
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
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
              // Expand active slice slightly for a rich responsive feel
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

        {/* Center cutout info tooltip (interactive hover/tap) */}
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
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
                numberOfLines={1}
              >
                {activeSegment.label}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── Bottom Reference Row (Exact Match to Screenshot) ── */}
      <View style={styles.footerRow}>
        <View style={styles.activeLegendLeft}>
          <View
            style={[
              styles.bulletDot,
              { backgroundColor: activeSegment?.color || '#3B82F6' },
            ]}
          />
          <Text style={[styles.activeLegendLabel, { color: titleColor }]}>
            {activeSegment?.label || 'Exceptional'}
          </Text>
        </View>

        <Text style={[styles.activeLegendValue, { color: titleColor }]}>
          {activeSegment ? `${activeSegment.value}%` : '12%'}
        </Text>
      </View>

      {/* ── Segment Selector Chips / Multi Legend ── */}
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
                    backgroundColor: isSelected ? pillActiveBg : pillBg,
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
                  {item.label}
                </Text>
                <Text style={[styles.chipPercent, { color: item.color }]}>
                  {item.value}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── High-Performance KPI Summary Footer ── */}
      {totalCount > 0 && (
        <View style={[styles.kpiFooter, { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: subtitleColor }]}>Total Monitored</Text>
            <Text style={[styles.kpiValue, { color: titleColor }]}>{totalCount} Units</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: subtitleColor }]}>Top Performers</Text>
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>
              {((segmentsWithArcs.find(s => s.id === 'exceptional')?.value || 0) +
                (segmentsWithArcs.find(s => s.id === 'outstanding')?.value || 0))}%
            </Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiLabel, { color: subtitleColor }]}>Benchmark</Text>
            <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>+14.2% YoY</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  titleWrap: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
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
    fontSize: 13,
    fontWeight: '500',
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
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 6,
  },
  activeLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeLegendLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activeLegendValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  segmentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 12,
  },
  chipPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  kpiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 1,
  },
  kpiCol: {
    alignItems: 'center',
    flex: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
});
