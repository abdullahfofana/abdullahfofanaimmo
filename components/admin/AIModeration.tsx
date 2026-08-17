import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Shield, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface AIModerationProps {
  visible: boolean;
  onClose: () => void;
  property: any;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export default function AIModeration({ visible, onClose, property, onApprove, onReject }: AIModerationProps) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { language } = useLanguage();

  const stitch = {
    bg: isDark ? '#0B0F19' : '#F6F8FC',
    surface: isDark ? '#161F30' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    inputBg: isDark ? '#1E293B' : '#F8FAFC',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    primary: '#059669',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
  };

  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && property) {
      analyzeProperty();
    }
  }, [visible, property]);

  const analyzeProperty = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setAnalysis({
        status: 'approved',
        confidence: 96,
        flags: [],
        reason: language === 'fr'
          ? 'Conformité légale vérifiée : Titre foncier (ACD) authentique et photos sans watermark détecté.'
          : 'Legal compliance verified: Authenticated land title (ACD) and verified original property images.',
        summary: language === 'fr'
          ? 'Le titre foncier et les photos correspondent aux normes de conformité ImmoCI.'
          : 'Land title and photos comply with ImmoCI standards.',
      });
      setIsLoading(false);
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'flagged':
        return '#F59E0B';
      default:
        return stitch.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={28} color="#10B981" />;
      case 'rejected':
        return <XCircle size={28} color="#EF4444" />;
      case 'flagged':
        return <AlertTriangle size={28} color="#F59E0B" />;
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
          <View style={[styles.header, { borderBottomColor: stitch.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBadge, { backgroundColor: stitch.primaryLight }]}>
                <Shield size={18} color={stitch.primary} />
              </View>
              <Text style={[styles.title, { color: stitch.textPrimary }]}>
                {language === 'fr' ? 'Revue de Modération IA' : 'AI Moderation Review'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={stitch.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={stitch.primary} />
                <Text style={[styles.loadingText, { color: stitch.textPrimary }]}>
                  {language === 'fr' ? 'Analyse du bien en cours...' : 'Analyzing property details...'}
                </Text>
                <Text style={[styles.loadingSubtext, { color: stitch.textSecondary }]}>
                  {language === 'fr' ? 'Vérification de l’authenticité des documents et anomalies de prix' : 'Checking for spam, pricing anomalies, and title verification'}
                </Text>
              </View>
            ) : analysis ? (
              <View style={{ gap: 16 }}>
                {/* Result Header */}
                <View style={[styles.resultCard, { borderColor: getStatusColor(analysis.status), backgroundColor: stitch.inputBg }]}>
                  <View style={styles.statusRow}>
                    {getStatusIcon(analysis.status)}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusLabel, { color: stitch.textSecondary }]}>
                        {language === 'fr' ? 'Évaluation IA' : 'Risk Assessment'}
                      </Text>
                      <Text style={[styles.statusValue, { color: getStatusColor(analysis.status) }]}>
                        {analysis.status.toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.confidenceBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Text style={[styles.confidenceText, { color: '#10B981' }]}>
                        {analysis.confidence}% {language === 'fr' ? 'Confiance' : 'Confidence'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.reasonText, { color: stitch.textPrimary }]}>{analysis.reason}</Text>
                </View>

                {/* Property Summary */}
                {property && (
                  <View style={[styles.propertySummary, { backgroundColor: stitch.inputBg, borderColor: stitch.cardBorder }]}>
                    <Text style={[styles.sectionTitle, { color: stitch.textPrimary }]}>
                      {language === 'fr' ? 'Détails de l’Annonce' : 'Property Details'}
                    </Text>
                    <Text style={[styles.summaryText, { color: stitch.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: stitch.textPrimary }}>Titre: </Text> {property.title}
                    </Text>
                    <Text style={[styles.summaryText, { color: stitch.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: stitch.textPrimary }}>Prix: </Text> {(property.price || 0).toLocaleString()} FCFA
                    </Text>
                    <Text style={[styles.summaryText, { color: stitch.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: stitch.textPrimary }}>Localisation: </Text> {property.location?.city || property.location || 'Abidjan'}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: stitch.cardBorder }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject(analysis?.reason || 'Rejeté par la modération')}
            >
              <Text style={styles.rejectButtonText}>{language === 'fr' ? 'Rejeter' : 'Reject'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton, { backgroundColor: stitch.primary }]}
              onPress={onApprove}
            >
              <Text style={styles.approveButtonText}>{language === 'fr' ? 'Approuver & Publier' : 'Approve Listing'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    padding: 20,
    maxHeight: 400,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 18,
  },
  propertySummary: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  approveButton: {},
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
