import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { TrendingUp, Users, Building2 } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MonthlyGrowthChartProps {
  data?: {
    month: string;
    properties: number;
    users: number;
  }[];
}

const defaultData = [
  { month: 'Jan', properties: 45, users: 120 },
  { month: 'Feb', properties: 78, users: 165 },
  { month: 'Mar', properties: 112, users: 185 },
  { month: 'Apr', properties: 145, users: 195 },
  { month: 'May', properties: 198, users: 225 },
  { month: 'Jun', properties: 245, users: 260 },
];

export default function MonthlyGrowthChart({ data = defaultData }: MonthlyGrowthChartProps) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t } = useLanguage();

  const [containerWidth, setContainerWidth] = useState(Math.min(SCREEN_WIDTH - 60, 700));
  const [activePoint, setActivePoint] = useState<number | null>(null);

  const chartWidth = Math.max(containerWidth, 300);
  const chartHeight = 200;
  const paddingHorizontal = 40;
  const paddingVertical = 30;
  const graphWidth = chartWidth - paddingHorizontal * 2;
  const graphHeight = chartHeight - paddingVertical * 2;

  const chartData = data.length > 0 ? data : defaultData;
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.users, d.properties)), 300);

  // Generate points
  const pointsUsers = chartData.map((d, index) => {
    const x = paddingHorizontal + (index / (chartData.length - 1)) * graphWidth;
    const y = paddingVertical + graphHeight - (d.users / maxVal) * graphHeight;
    return { x, y, ...d };
  });

  const pointsProps = chartData.map((d, index) => {
    const x = paddingHorizontal + (index / (chartData.length - 1)) * graphWidth;
    const y = paddingVertical + graphHeight - (d.properties / maxVal) * graphHeight;
    return { x, y, ...d };
  });

  // SVG smooth curve generator
  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = arr[i - 1];
      const cp1x = prev.x + (point.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (point.x - prev.x) / 2;
      const cp2y = point.y;
      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
    }, '');
  };

  const lineUsersPath = createPath(pointsUsers);
  const areaUsersPath = `${lineUsersPath} L ${pointsUsers[pointsUsers.length - 1].x},${paddingVertical + graphHeight} L ${pointsUsers[0].x},${paddingVertical + graphHeight} Z`;

  const linePropsPath = createPath(pointsProps);
  const areaPropsPath = `${linePropsPath} L ${pointsProps[pointsProps.length - 1].x},${paddingVertical + graphHeight} L ${pointsProps[0].x},${paddingVertical + graphHeight} Z`;

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
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
            <TrendingUp size={18} color="#6366F1" />
          </View>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>{t('admin_monthly_growth')}</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('admin_monthly_growth_sub')}</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
            <Text style={[styles.legendText, { color: textSecondary }]}>{t('admin_stat_total_users')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: textSecondary }]}>{t('admin_stat_total_properties')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
              <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="propsGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid horizontal lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingVertical + graphHeight * ratio;
            return (
              <Line
                key={i}
                x1={paddingHorizontal}
                y1={y}
                x2={chartWidth - paddingHorizontal}
                y2={y}
                stroke={gridColor}
                strokeDasharray="4,4"
                strokeWidth={1}
              />
            );
          })}

          {/* User Area & Line */}
          <Path d={areaUsersPath} fill="url(#usersGradient)" />
          <Path d={lineUsersPath} fill="none" stroke="#6366F1" strokeWidth={2.5} />

          {/* Properties Area & Line */}
          <Path d={areaPropsPath} fill="url(#propsGradient)" />
          <Path d={linePropsPath} fill="none" stroke="#10B981" strokeWidth={2.5} />

          {/* Data Points */}
          {pointsUsers.map((p, i) => (
            <G key={`u-${i}`}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={activePoint === i ? 6 : 4}
                fill={isDark ? '#161F30' : '#FFFFFF'}
                stroke="#6366F1"
                strokeWidth={2}
              />
              <Circle
                cx={pointsProps[i].x}
                cy={pointsProps[i].y}
                r={activePoint === i ? 6 : 4}
                fill={isDark ? '#161F30' : '#FFFFFF'}
                stroke="#10B981"
                strokeWidth={2}
              />
              {/* X Axis Labels */}
              <SvgText
                x={p.x}
                y={chartHeight - 6}
                fontSize="11"
                fill={textSecondary}
                textAnchor="middle"
                fontWeight="500"
              >
                {p.month}
              </SvgText>
            </G>
          ))}
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
    flexWrap: 'wrap',
    gap: 12,
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
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
