import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis } from 'victory';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { DollarSign } from 'lucide-react-native';
import Spacing from '@/constants/spacing';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

const { width } = Dimensions.get('window');

interface RevenueAnalyticsChartProps {
  data?: {
    month: string;
    revenue: number;
  }[];
}

const defaultData = [
  { month: 'Jan', revenue: 14500 },
  { month: 'Feb', revenue: 17200 },
  { month: 'Mar', revenue: 20800 },
  { month: 'Apr', revenue: 18900 },
  { month: 'May', revenue: 24300 },
  { month: 'Jun', revenue: 27800 },
];

export default function RevenueAnalyticsChart({ data = defaultData }: RevenueAnalyticsChartProps) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t } = useLanguage();

  const [containerWidth, setContainerWidth] = React.useState(Math.min(width - 60, 700));
  const chartHeight = 220;

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const surfaceBg = isDark ? '#161F30' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const axisColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <View
      style={[styles.container, { backgroundColor: surfaceBg, borderColor }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 40)}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
            <DollarSign size={18} color="#10B981" />
          </View>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>{t('admin_revenue_analytics')}</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('admin_revenue_trend')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <VictoryChart
          width={Math.max(containerWidth, 280)}
          height={chartHeight}
          padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
          domainPadding={{ x: 20 }}
        >
          <Defs>
            <LinearGradient id="emeraldBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#34D399" stopOpacity="1" />
              <Stop offset="100%" stopColor="#059669" stopOpacity="0.85" />
            </LinearGradient>
          </Defs>

          {/* X Axis */}
          <VictoryAxis
            style={{
              axis: { stroke: axisColor },
              tickLabels: { fontSize: 12, fill: textSecondary, fontWeight: 600 },
              grid: { stroke: 'transparent' },
            }}
          />

          {/* Y Axis */}
          <VictoryAxis
            dependentAxis
            tickFormat={(value) => formatCurrency(value)}
            style={{
              axis: { stroke: axisColor },
              tickLabels: { fontSize: 12, fill: textSecondary, fontWeight: 600 },
              grid: { stroke: axisColor, strokeDasharray: '4,4', opacity: 0.5 },
            }}
          />

          {/* Bars */}
          <VictoryBar
            data={data}
            x="month"
            y="revenue"
            cornerRadius={{ top: 6 }}
            style={{
              data: {
                fill: 'url(#emeraldBarGradient)',
              },
            }}
            barWidth={Math.min(28, containerWidth / 10)}
          />
        </VictoryChart>
      </View>

      {/* Summary KPI Pills at Bottom */}
      <View style={[styles.stats, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: textSecondary }]}>{t('admin_average')}</Text>
          <Text style={[styles.statValue, { color: textPrimary }]}>
            {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0) / data.length)} FCFA
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: textSecondary }]}>{t('admin_total')}</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))} FCFA
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: textSecondary }]}>{t('admin_peak')}</Text>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>
            {formatCurrency(Math.max(...data.map((d) => d.revenue)))} FCFA
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 20,
  },
  header: {
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 1,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
});
