/**
 * AdminAIInsightsPanel — AI-powered analytics panel for the admin dashboard.
 * Uses Agent 6 (analyticsAgent) via tRPC.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import {
  Sparkles, RefreshCw, TrendingUp, AlertTriangle,
  Lightbulb, BarChart2, CheckCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import { trpc } from '@/lib/trpc';

interface InsightsReport {
  summary: string;
  keyMetrics: Record<string, string | number>;
  anomalies: string[];
  trends: string[];
  recommendations: string[];
  generatedAt: string;
}

export default function AdminAIInsightsPanel() {
  const [report, setReport] = useState<InsightsReport | null>(null);
  const generateMutation = trpc.agents.generateAnalyticsReport.useMutation();

  const generate = async () => {
    try {
      const res = await generateMutation.mutateAsync({});
      setReport(res.report as InsightsReport);
    } catch {
      // silently fail
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('fr-CI', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Sparkles size={16} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>AI Insights</Text>
            <Text style={styles.subtitle}>Rapport généré par l'IA</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.generateBtn, generateMutation.isPending && styles.generateBtnDisabled]}
          onPress={generate}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending
            ? <ActivityIndicator size="small" color="#fff" />
            : <><RefreshCw size={14} color="#fff" /><Text style={styles.generateBtnText}>Générer</Text></>
          }
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {!report && !generateMutation.isPending && (
        <View style={styles.emptyState}>
          <BarChart2 size={40} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Aucun rapport généré</Text>
          <Text style={styles.emptySubtitle}>
            Appuyez sur "Générer" pour obtenir une analyse IA de la plateforme.
          </Text>
        </View>
      )}

      {generateMutation.isPending && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyse des données en cours...</Text>
          <Text style={styles.loadingSubText}>L'IA examine métriques, tendances et anomalies.</Text>
        </View>
      )}

      {/* Report */}
      {report && (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.report}>
          {/* Generated at */}
          <Text style={styles.generatedAt}>
            Rapport du {formatTime(report.generatedAt)}
          </Text>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{report.summary}</Text>
          </View>

          {/* Key Metrics */}
          {Object.keys(report.keyMetrics ?? {}).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Métriques Clés</Text>
              <View style={styles.metricsGrid}>
                {Object.entries(report.keyMetrics).map(([key, val]) => (
                  <View key={key} style={styles.metricCard}>
                    <Text style={styles.metricValue}>{val}</Text>
                    <Text style={styles.metricLabel}>{key.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Trends */}
          {(report.trends ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Tendances</Text>
              {report.trends.map((trend, i) => (
                <View key={i} style={styles.listItem}>
                  <TrendingUp size={14} color="#059669" style={styles.listIcon} />
                  <Text style={styles.listText}>{trend}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Anomalies */}
          {(report.anomalies ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Anomalies Détectées</Text>
              {report.anomalies.map((anomaly, i) => (
                <View key={i} style={[styles.listItem, styles.anomalyItem]}>
                  <AlertTriangle size={14} color="#f59e0b" style={styles.listIcon} />
                  <Text style={[styles.listText, styles.anomalyText]}>{anomaly}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {(report.recommendations ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Recommandations</Text>
              {report.recommendations.map((rec, i) => (
                <View key={i} style={[styles.listItem, styles.recItem]}>
                  <Lightbulb size={14} color={Colors.primary} style={styles.listIcon} />
                  <Text style={[styles.listText, styles.recText]}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: `${Colors.primary}08`,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  emptyState: {
    alignItems: 'center', padding: Spacing.xl * 1.5, gap: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },

  loadingState: {
    alignItems: 'center', padding: Spacing.xl * 1.5, gap: 12,
  },
  loadingText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  loadingSubText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },

  report: { padding: Spacing.lg },
  generatedAt: { fontSize: 11, color: Colors.textLight, marginBottom: 12, textAlign: 'right' },

  summaryCard: {
    backgroundColor: `${Colors.primary}0A`,
    borderRadius: 12, padding: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  summaryText: { fontSize: 14, color: Colors.text, lineHeight: 22 },

  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: {
    flex: 1, minWidth: 120,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  metricLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },

  listItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4,
  },
  anomalyItem: { backgroundColor: 'rgba(245,158,11,0.08)' },
  recItem: { backgroundColor: `${Colors.primary}08` },
  listIcon: { marginTop: 2, flexShrink: 0 },
  listText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },
  anomalyText: { color: '#92400e' },
  recText: { color: Colors.text },
});
