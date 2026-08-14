import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis, VictoryTooltip, VictoryVoronoiContainer } from 'victory';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { TrendingUp } from 'lucide-react-native';
import Spacing from '@/constants/spacing';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

const { width } = Dimensions.get('window');

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

  const [containerWidth, setContainerWidth] = React.useState(Math.min(width - 60, 700));
  const chartHeight = 280;

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
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
            <TrendingUp size={18} color="#6366F1" />
          </View>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>{t('admin_monthly_growth')}</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('admin_monthly_growth_sub')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <VictoryChart
          width={Math.max(containerWidth, 280)}
          height={chartHeight}
          padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) =>
                datum.childName === 'usersLine'
                  ? `${datum.month}\n${t('admin_properties_label')}: ${datum.properties}\n${t('admin_users_label')}: ${datum.users}`
                  : ''
              }
              labelComponent={
                <VictoryTooltip
                  cornerRadius={8}
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    fill: isDark ? '#F8FAFC' : '#0F172A',
                  }}
                  flyoutStyle={{
                    fill: isDark ? '#1E293B' : '#FFFFFF',
                    stroke: isDark ? '#334155' : '#CBD5E1',
                    strokeWidth: 1,
                  }}
                />
              }
            />
          }
        >
          <Defs>
            <LinearGradient id="growthUsersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="growthPropsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
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
            style={{
              axis: { stroke: axisColor },
              tickLabels: { fontSize: 12, fill: textSecondary, fontWeight: 600 },
              grid: { stroke: axisColor, strokeDasharray: '4,4', opacity: 0.5 },
            }}
          />

          {/* Users Area */}
          <VictoryArea
            data={data}
            x="month"
            y="users"
            style={{
              data: {
                fill: 'url(#growthUsersGradient)',
                stroke: 'transparent',
              },
            }}
          />

          {/* Properties Area */}
          <VictoryArea
            data={data}
            x="month"
            y="properties"
            style={{
              data: {
                fill: 'url(#growthPropsGradient)',
                stroke: 'transparent',
              },
            }}
          />

          {/* Users Line */}
          <VictoryLine
            name="usersLine"
            data={data}
            x="month"
            y="users"
            style={{
              data: { stroke: '#10B981', strokeWidth: 3 },
            }}
          />

          {/* Properties Line */}
          <VictoryLine
            name="propsLine"
            data={data}
            x="month"
            y="properties"
            style={{
              data: { stroke: '#6366F1', strokeWidth: 3 },
            }}
          />
        </VictoryChart>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
          <Text style={[styles.legendText, { color: textSecondary }]}>{t('admin_properties_label')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: textSecondary }]}>{t('admin_users_label')}</Text>
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
});
