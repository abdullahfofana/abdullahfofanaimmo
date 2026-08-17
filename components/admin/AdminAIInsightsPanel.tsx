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

const DEFAULT_REPORT: InsightsReport = {
  summary:
    'Croissance soutenue des transactions à Cocody et Marcory (+18.4% ce mois). Le taux de conversion des annonces vérifiées (ACD) est 3.2x supérieur aux annonces standard.',
  keyMetrics: {
    'Revenu Mensuel': '123.1M FCFA',
    'Propriétés Actives': '212',
    'Taux de Conversion': '8.6%',
    'Délai Moyen Vente': '24 jours',
  },
  anomalies: [
    'Baisse temporaire des demandes de location à Yopougon (-4.2%) due aux rénovations urbaines.',
    'Pic de recherches inhabituelles pour les terrains titrés à Bingerville (+42%).',
  ],
  trends: [
    'Forte demande pour les villas duplex 5 pièces avec piscine à Cocody Ambassades.',
    'Augmentation de 28% des visites virtuelles assistées par IA.',
    'Hausse des paiements par Mobile Money (Wave, Orange Money) représentant 68% des frais de dossier.',
  ],
  recommendations: [
    'Accélérer la vérification des titres fonciers pour réduire le temps de mise en ligne sous 24h.',
    'Lancer une campagne ciblée pour les résidences meublées à Marcory Zone 4.',
    'Mettre en avant le badge "Vendeur Certifié ImmoCI" pour stimuler la confiance des acheteurs.',
  ],
  generatedAt: new Date().toISOString(),
};

export default function AdminAIInsightsPanel() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t, language } = useLanguage();

  const [report, setReport] = useState<InsightsReport | null>(DEFAULT_REPORT);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    // Simulate smart AI generation
    setTimeout(() => {
      setReport({
        ...DEFAULT_REPORT,
        generatedAt: new Date().toISOString(),
      });
      setIsGenerating(false);
    }, 800);
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
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={generate}
          disabled={isGenerating}
          activeOpacity={0.85}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw size={14} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>{t('admin_ai_generate')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {report ? (
        <ScrollView style={styles.body} nestedScrollEnabled>
          {/* Summary Box */}
          <View style={[styles.section, { backgroundColor: cardItemBg, borderColor }]}>
            <View style={styles.sectionHeader}>
              <BarChart2 size={16} color="#10B981" />
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                {language === 'fr' ? 'Synthèse Exécutive' : 'Executive Summary'}
              </Text>
            </View>
            <Text style={[styles.summaryText, { color: textSecondary }]}>{report.summary}</Text>
          </View>

          {/* Key Metrics Grid */}
          <View style={styles.metricsGrid}>
            {Object.entries(report.keyMetrics).map(([k, v]) => (
              <View key={k} style={[styles.metricCard, { backgroundColor: cardItemBg, borderColor }]}>
                <Text style={[styles.metricKey, { color: textSecondary }]}>{k}</Text>
                <Text style={[styles.metricVal, { color: textPrimary }]}>{String(v)}</Text>
              </View>
            ))}
          </View>

          {/* Trends */}
          {report.trends?.length > 0 && (
            <View style={[styles.section, { backgroundColor: cardItemBg, borderColor }]}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={16} color="#6366F1" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                  {language === 'fr' ? 'Tendances du Marché' : 'Market Trends'}
                </Text>
              </View>
              {report.trends.map((trend, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.bullet, { backgroundColor: '#6366F1' }]} />
                  <Text style={[styles.listText, { color: textSecondary }]}>{trend}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Anomalies */}
          {report.anomalies?.length > 0 && (
            <View style={[styles.section, { backgroundColor: cardItemBg, borderColor }]}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                  {language === 'fr' ? 'Points de Vigilance' : 'Watch Points'}
                </Text>
              </View>
              {report.anomalies.map((anom, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.bullet, { backgroundColor: '#F59E0B' }]} />
                  <Text style={[styles.listText, { color: textSecondary }]}>{anom}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <View style={[styles.section, { backgroundColor: cardItemBg, borderColor }]}>
              <View style={styles.sectionHeader}>
                <Lightbulb size={16} color="#10B981" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                  {language === 'fr' ? 'Recommandations Stratégiques' : 'Strategic Recommendations'}
                </Text>
              </View>
              {report.recommendations.map((rec, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.bullet, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.listText, { color: textSecondary }]}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.timestamp, { color: textSecondary }]}>
            {language === 'fr' ? 'Dernière mise à jour :' : 'Last updated:'} {formatTime(report.generatedAt)}
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    padding: 16,
    maxHeight: 450,
  },
  section: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  metricKey: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  timestamp: {
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 8,
  },
});
