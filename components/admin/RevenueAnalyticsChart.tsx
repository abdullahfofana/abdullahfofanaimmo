import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, Line, Text as SvgText, G } from 'react-native-svg';
import { DollarSign } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RevenueAnalyticsChartProps {
  data?: {
    month: string;
    revenue: number;
  }[];
}

const defaultData = [
  { month: 'Jan', revenue: 14500000 },
  { month: 'Feb', revenue: 17200000 },
  { month: 'Mar', revenue: 20800000 },
  { month: 'Apr', revenue: 18900000 },
  { month: 'May', revenue: 24300000 },
  { month: 'Jun', revenue: 27800000 },
];

export default function RevenueAnalyticsChart({ data = defaultData }: RevenueAnalyticsChartProps) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t } = useLanguage();

  const [containerWidth, setContainerWidth] = useState(Math.min(SCREEN_WIDTH - 60, 700));
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const chartWidth = Math.max(containerWidth, 300);
  const chartHeight = 220;
  const paddingHorizontal = 40;
  const paddingVertical = 30;
  const graphWidth = chartWidth - paddingHorizontal * 2;
  const graphHeight = chartHeight - paddingVertical * 2;

  const chartData = data.length > 0 ? data : defaultData;
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 30000000);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  const slotWidth = graphWidth / chartData.length;
  const barWidth = Math.min(slotWidth * 0.52, 42);

  const surfaceBg = isDark ? '#161F30' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <View
      style={[styles.container, { backgroundColor: surfaceBg, borderColor }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 40;
        if (w > 0) setContainerWidth(w);
      }}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
            <DollarSign size={18} color="#10B981" />
          </View>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>{t('admin_revenue_analytics')}</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('admin_revenue_analytics_sub')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
              <Stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </LinearGradient>
            <LinearGradient id="revenueBarActiveGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#34D399" stopOpacity="1" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
            </LinearGradient>
          </Defs>

          {/* Grid Lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingVertical + graphHeight * ratio;
            const val = maxRevenue * (1 - ratio);
            return (
              <G key={i}>
                <Line
                  x1={paddingHorizontal}
                  y1={y}
                  x2={chartWidth - paddingHorizontal}
                  y2={y}
                  stroke={gridColor}
                  strokeDasharray="4,4"
                  strokeWidth={1}
                />
                <SvgText
                  x={paddingHorizontal - 8}
                  y={y + 4}
                  fontSize="9"
                  fill={textSecondary}
                  textAnchor="end"
                >
                  {formatCurrency(val)}
                </SvgText>
              </G>
            );
          })}

          {/* Bars */}
          {chartData.map((d, i) => {
            const barHeight = Math.max((d.revenue / maxRevenue) * graphHeight, 6);
            const x = paddingHorizontal + i * slotWidth + (slotWidth - barWidth) / 2;
            const y = paddingVertical + graphHeight - barHeight;

            return (
              <G key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  ry={6}
                  fill={hoveredBar === i ? 'url(#revenueBarActiveGradient)' : 'url(#revenueBarGradient)'}
                />
                {/* Month label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - 6}
                  fontSize="11"
                  fill={textSecondary}
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {d.month}
                </SvgText>
                {/* Value on top of bar */}
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 6}
                  fontSize="10"
                  fill={isDark ? '#34D399' : '#059669'}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {formatCurrency(d.revenue)}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
