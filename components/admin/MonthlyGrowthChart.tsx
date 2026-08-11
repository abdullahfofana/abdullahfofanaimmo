import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis, VictoryTooltip, VictoryVoronoiContainer } from 'victory';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

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
    const chartWidth = Math.min(width - 80, 600);
    const chartHeight = 300;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.icon}>📈</Text>
                    <Text style={styles.title}>Monthly Growth</Text>
                </View>
                <Text style={styles.subtitle}>Properties and users over time</Text>
            </View>

            <View style={styles.chartContainer}>
                <VictoryChart
                    width={chartWidth}
                    height={chartHeight}
                    padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                    containerComponent={
                        <VictoryVoronoiContainer
                            labels={({ datum }) => `${datum.month}\nproperties: ${datum.properties}\nusers: ${datum.users}`}
                            labelComponent={
                                <VictoryTooltip
                                    style={{ fontSize: 12, fill: Colors.text }}
                                    flyoutStyle={{
                                        fill: Colors.white,
                                        stroke: Colors.border,
                                        strokeWidth: 1,
                                    }}
                                />
                            }
                        />
                    }
                >
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
                        style={{
                            axis: { stroke: Colors.border },
                            tickLabels: { fontSize: 12, fill: Colors.textSecondary },
                            grid: { stroke: Colors.border, strokeDasharray: '4,4', opacity: 0.3 },
                        }}
                    />

                    {/* Users Area */}
                    <VictoryArea
                        data={data}
                        x="month"
                        y="users"
                        style={{
                            data: {
                                fill: 'url(#usersGradient)',
                                stroke: '#14B8A6',
                                strokeWidth: 2,
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
                                fill: 'url(#propertiesGradient)',
                                stroke: Colors.primary,
                                strokeWidth: 2,
                            },
                        }}
                    />

                    {/* Users Line */}
                    <VictoryLine
                        data={data}
                        x="month"
                        y="users"
                        style={{
                            data: { stroke: '#14B8A6', strokeWidth: 2 },
                        }}
                    />

                    {/* Properties Line */}
                    <VictoryLine
                        data={data}
                        x="month"
                        y="properties"
                        style={{
                            data: { stroke: Colors.primary, strokeWidth: 2 },
                        }}
                    />
                </VictoryChart>
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.legendText}>properties</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#14B8A6' }]} />
                    <Text style={styles.legendText}>users</Text>
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
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 14,
    },
});
