import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis } from 'victory';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

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
    const [containerWidth, setContainerWidth] = React.useState(width - 80);
    const chartHeight = 220; // Dribbble: smaller, sleeker charts

    const formatCurrency = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k`;
        }
        return value.toString();
    };

    return (
        <View style={styles.container} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 40)}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.icon}>💰</Text>
                    <Text style={styles.title}>Revenue Analytics</Text>
                </View>
                <Text style={styles.subtitle}>Monthly revenue trend</Text>
            </View>

            <View style={styles.chartContainer}>
                <VictoryChart
                    width={containerWidth}
                    height={chartHeight}
                    padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
                    domainPadding={{ x: 20 }}
                >
                    <Defs>
                        <LinearGradient id="emeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor="#34D399" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
                        </LinearGradient>
                    </Defs>
                    {/* X Axis */}
                    <VictoryAxis
                        style={{
                            axis: { stroke: Colors.border },
                            tickLabels: { fontSize: 12, fill: Colors.textSecondary },
                            grid: { stroke: 'transparent' },
                        }}
                    />

                    {/* Y Axis */}
                    <VictoryAxis
                        dependentAxis
                        tickFormat={(value) => formatCurrency(value)}
                        style={{
                            axis: { stroke: Colors.border },
                            tickLabels: { fontSize: 12, fill: Colors.textSecondary },
                            grid: { stroke: Colors.border, strokeDasharray: '4,4', opacity: 0.3 },
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
                                fill: 'url(#emeraldGradient)',
                            },
                        }}
                        barWidth={Math.min(32, containerWidth / 12)}
                    />
                </VictoryChart>
            </View>

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Average</Text>
                    <Text style={styles.statValue}>
                        {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0) / data.length)}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statValue}>
                        {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Peak</Text>
                    <Text style={styles.statValue}>
                        {formatCurrency(Math.max(...data.map(d => d.revenue)))}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },
    header: {
        marginBottom: 20,
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
        ...Typography.h3,
        color: Colors.text,
        fontSize: 18,
        fontWeight: '600',
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 14,
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        ...Typography.h3,
        color: Colors.text,
        fontSize: 18,
        fontWeight: '600',
    },
});
