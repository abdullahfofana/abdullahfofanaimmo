import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  BarChart2,
} from 'lucide-react-native';
import Spacing from '@/constants/spacing';
import { trpc } from '@/lib/trpc';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface InsightsReport {
  summary: string;
  keyMetrics: Record<string, string | number>;
  anomalies: string[];
  trends: string[];
  recommendations: string[];
  generatedAt: string;
}

export default function AdminAIInsightsPanel() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t, language } = useLanguage();

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
    return d.toLocaleString(language === 'fr' ? 'fr-CI' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  };

  const surfaceBg = isDark ? '#161F30' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const cardItemBg = isDark ? '#1E293B' : '#F8FAFC';

  return (
    <View style={[styles.container, { backgroundColor: surfaceBg, borderColor }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: borderColor,
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }]}>
            <Sparkles size={18} color="#10B981" />
          </View>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>{t('admin_ai_insights')}</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('admin_ai_insights_sub')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.generateBtn, generateMutation.isPending && styles.generateBtnDisabled]}
          onPress={generate}
          disabled={generateMutation.isPending}
          activeOpacity={0.85}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw size={14} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>{t('admin_ai_generate')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {!report && !generateMutation.isPending && (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' }]}>
            <BarChart2 size={36} color={textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>{t('admin_ai_no_report')}</Text>
          <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
            {t('admin_ai_no_report_sub')}
          </Text>
        </View>
      )}

      {generateMutation.isPending && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={[styles.loadingText, { color: textPrimary }]}>{t('admin_ai_analyzing')}</Text>
          <Text style={[styles.loadingSubText, { color: textSecondary }]}>
            {language === 'fr'
              ? "L'IA examine métriques, tendances et anomalies."
              : 'AI is examining KPIs, anomaly patterns, and growth trends.'}
          </Text>
        </View>
      )}

      {/* Report */}
      {report && (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.report}>
          <Text style={[styles.generatedAt, { color: textSecondary }]}>
            {language === 'fr' ? 'Rapport du' : 'Report generated at'} {formatTime(report.generatedAt)}
          </Text>

          {/* Summary */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                borderColor: '#10B981',
              },
            ]}
          >
            <Text style={[styles.summaryText, { color: textPrimary }]}>{report.summary}</Text>
          </View>

          {/* Key Metrics */}
          {Object.keys(report.keyMetrics ?? {}).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                📊 {language === 'fr' ? 'Métriques Clés' : 'Key Metrics'}
              </Text>
              <View style={styles.metricsGrid}>
                {Object.entries(report.keyMetrics).map(([key, val]) => (
                  <View
                    key={key}
                    style={[
                      styles.metricCard,
                      {
                        backgroundColor: cardItemBg,
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={styles.metricValue}>{val}</Text>
                    <Text style={[styles.metricLabel, { color: textSecondary }]}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Trends */}
          {(report.trends ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                📈 {language === 'fr' ? 'Tendances' : 'Trends'}
              </Text>
              {report.trends.map((trend, i) => (
                <View
                  key={i}
                  style={[
                    styles.listItem,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                    },
                  ]}
                >
                  <TrendingUp size={15} color="#10B981" style={styles.listIcon} />
                  <Text style={[styles.listText, { color: textPrimary }]}>{trend}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Anomalies */}
          {(report.anomalies ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                ⚠️ {language === 'fr' ? 'Anomalies Détectées' : 'Detected Anomalies'}
              </Text>
              {report.anomalies.map((anomaly, i) => (
                <View
                  key={i}
                  style={[
                    styles.listItem,
                    {
                      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                    },
                  ]}
                >
                  <AlertTriangle size={15} color="#F59E0B" style={styles.listIcon} />
                  <Text style={[styles.listText, { color: isDark ? '#FDE68A' : '#92400E' }]}>{anomaly}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {(report.recommendations ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                💡 {language === 'fr' ? 'Recommandations' : 'Recommendations'}
              </Text>
              {report.recommendations.map((rec, i) => (
                <View
                  key={i}
                  style={[
                    styles.listItem,
                    {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
                    },
                  ]}
                >
                  <Lightbulb size={15} color="#6366F1" style={styles.listIcon} />
                  <Text style={[styles.listText, { color: textPrimary }]}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: Spacing.md }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
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
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  emptyState: {
    alignItems: 'center',
    padding: 36,
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
  },
  loadingState: {
    alignItems: 'center',
    padding: 36,
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  loadingSubText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  report: {
    padding: 20,
  },
  generatedAt: {
    fontSize: 11.5,
    marginBottom: 12,
    textAlign: 'right',
  },
  summaryCard: {
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 18,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#10B981',
  },
  metricLabel: {
    fontSize: 11.5,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  listIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
});
