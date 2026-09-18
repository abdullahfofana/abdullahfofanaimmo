/**
 * ImmoCI — Enterprise Audit Logs & Security Trails
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Shield,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Building,
  Key,
  Eye,
  X,
  Sparkles,
  ChevronRight,
  History,
  Lock,
  FileSpreadsheet,
} from 'lucide-react-native';

import {
  AuditEvent,
  AuditAction,
  AuditSeverity,
  loadAuditEvents,
} from '@/utils/auditLogger';
import { downloadExcelFile, ExcelSheet } from '@/utils/excelExport';
import { useLanguage } from '@/providers/LanguageProvider';

interface AuditLogsProps {
  isDark?: boolean;
}

export default function AuditLogs({ isDark = true }: AuditLogsProps) {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | '24H' | '7D' | '30D'>('ALL');
  const [inspectingEvent, setInspectingEvent] = useState<AuditEvent | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshEvents = async () => {
    setIsLoading(true);
    const data = await loadAuditEvents();
    setEvents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshEvents();
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actorMatch =
          ev.actor.name.toLowerCase().includes(q) ||
          ev.actor.email.toLowerCase().includes(q) ||
          ev.actor.role.toLowerCase().includes(q);
        const targetMatch = ev.target.toLowerCase().includes(q);
        const actionMatch = ev.action.toLowerCase().includes(q);
        if (!actorMatch && !targetMatch && !actionMatch) return false;
      }

      // Action Filter
      if (selectedAction !== 'ALL') {
        if (selectedAction === 'STAFF' && !ev.action.startsWith('STAFF')) return false;
        if (selectedAction === 'PROPERTY' && !ev.action.startsWith('PROPERTY')) return false;
        if (selectedAction === 'SECURITY' && ev.action !== 'UNAUTHORIZED_ACCESS_ATTEMPT') return false;
      }

      // Severity Filter
      if (selectedSeverity !== 'ALL' && ev.severity !== selectedSeverity) {
        return false;
      }

      // Time filter
      if (timeFilter !== 'ALL') {
        const evTime = new Date(ev.timestamp).getTime();
        const now = Date.now();
        const msMap = {
          '24H': 24 * 3600 * 1000,
          '7D': 7 * 24 * 3600 * 1000,
          '30D': 30 * 24 * 3600 * 1000,
        };
        if (now - evTime > msMap[timeFilter]) return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedAction, selectedSeverity, timeFilter]);

  // KPIs
  const stats = useMemo(() => {
    const total = events.length;
    const staffChanges = events.filter((e) => e.action.startsWith('STAFF')).length;
    const propVerifs = events.filter((e) => e.action.startsWith('PROPERTY')).length;
    const alerts = events.filter((e) => e.severity === 'ALERT').length;
    return { total, staffChanges, propVerifs, alerts };
  }, [events]);

  // Excel Export
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const summaryRows = [
        ['Registre Journal d\'Audit & Sécurité — ImmoCI Enterprise', ''],
        ['Date de génération', new Date().toLocaleString('fr-FR')],
        ['Total événements enregistrés', stats.total],
        ['Modifications Collaborateurs/Rôles', stats.staffChanges],
        ['Vérifications Biens Immobiliers', stats.propVerifs],
        ['Alertes de Sécurité / Tentatives Refusées', stats.alerts],
        ['Filtre appliqué', `${selectedAction} / ${selectedSeverity} / ${timeFilter}`],
        ['Devise Référence', 'FCFA (XOF)'],
      ];

      const detailHeaders = [
        'ID Audit',
        'Date & Heure',
        'Action',
        'Sévérité',
        'Auteur (Nom)',
        'Auteur (Email)',
        'Auteur (Rôle)',
        'Cible / Ressource',
        'Département',
        'Détails / Métadonnées',
      ];

      const detailRows = filteredEvents.map((ev) => [
        ev.id,
        new Date(ev.timestamp).toLocaleString('fr-FR'),
        ev.action,
        ev.severity,
        ev.actor.name,
        ev.actor.email,
        ev.actor.role,
        ev.target,
        ev.department || 'N/A',
        ev.details ? JSON.stringify(ev.details) : '',
      ]);

      const sheets: ExcelSheet[] = [
        {
          name: 'Résumé Audit',
          rows: [
            ['Indicateur', 'Valeur'],
            ...summaryRows,
          ],
        },
        {
          name: 'Pistes Audit Détaillées',
          rows: [
            detailHeaders,
            ...detailRows,
          ],
        },
      ];

      const filename = `ImmoCI_Audit_Security_Trail_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const success = downloadExcelFile(filename, sheets);
      if (success) {
        showToast(t('audit_toast_exported'));
      } else {
        showToast('Erreur lors de l\'export du journal d\'audit');
      }
    } catch (err: any) {
      console.error('[AuditLogs] Export error:', err);
      showToast('Erreur lors de l\'export du journal d\'audit');
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityBadge = (sev: AuditSeverity) => {
    if (sev === 'ALERT') {
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
    }
    if (sev === 'WARNING') {
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' };
    }
    return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
  };

  const getActionFriendlyName = (action: AuditAction) => {
    const names: Record<AuditAction, { fr: string; en: string; ar: string }> = {
      STAFF_CREATED: { fr: 'Collaborateur Créé', en: 'Staff Created', ar: 'إنشاء حساب موظف' },
      STAFF_UPDATED: { fr: 'Fiche Modifiée', en: 'Staff Updated', ar: 'تحديث بيانات موظف' },
      STAFF_ROLE_CHANGED: { fr: 'Rôle Modifié', en: 'Role Changed', ar: 'تعديل الدور الوظيفي' },
      STAFF_PERMISSIONS_CHANGED: { fr: 'Permissions Révisées', en: 'Permissions Modified', ar: 'تعديل الصلاحيات' },
      STAFF_STATUS_CHANGED: { fr: 'Statut Modifié', en: 'Status Changed', ar: 'تغيير حالة الحساب' },
      PROPERTY_APPROVED: { fr: 'Bien Approuvé', en: 'Property Approved', ar: 'اعتماد العقار' },
      PROPERTY_REJECTED: { fr: 'Bien Rejeté', en: 'Property Rejected', ar: 'رفض إعلان العقار' },
      PROPERTY_DELETED: { fr: 'Bien Supprimé', en: 'Property Deleted', ar: 'حذف العقار نهائياً' },
      SETTINGS_CHANGED: { fr: 'Paramètres Système', en: 'Settings Changed', ar: 'تعديل الإعدادات' },
      UNAUTHORIZED_ACCESS_ATTEMPT: { fr: 'Sécurité : Accès Refusé', en: 'Security: Access Denied', ar: 'أمان: وصول مرفوض' },
      LOGIN_SUCCESS: { fr: 'Connexion Réussie', en: 'Login Success', ar: 'تسجيل دخول ناجح' },
      LOGIN_FAILED: { fr: 'Échec de Connexion', en: 'Login Failed', ar: 'فشل تسجيل الدخول' },
    };
    return names[action]?.[language] || names[action]?.fr || action;
  };

  const theme = {
    bg: isDark ? '#0F172A' : '#F8FAFC',
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    accent: '#059669',
    accentLight: 'rgba(5, 150, 105, 0.15)',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.accentLight }]}>
              <History size={22} color={theme.accent} />
            </View>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>{t('audit_page_title')}</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {t('audit_page_sub')}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.exportBtn, isExporting && { opacity: 0.6 }]}
          onPress={handleExportExcel}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FileSpreadsheet size={16} color="#FFFFFF" />
          )}
          <Text style={styles.exportBtnText}>{t('common_export_excel')}</Text>
        </TouchableOpacity>
      </View>

      {/* Stat Cards */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>{t('audit_kpi_total')}</Text>
          <Text style={[styles.kpiValue, { color: theme.text }]}>{stats.total}</Text>
          <Text style={styles.kpiSub}>Toutes actions confondues</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>{t('audit_kpi_staff')}</Text>
          <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>{stats.staffChanges}</Text>
          <Text style={styles.kpiSub}>Créations, rôles et permissions</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>{t('audit_kpi_properties')}</Text>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>{stats.propVerifs}</Text>
          <Text style={styles.kpiSub}>Validations et refus d'annonces</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>{t('audit_kpi_alerts')}</Text>
          <Text style={[styles.kpiValue, { color: stats.alerts > 0 ? '#EF4444' : '#10B981' }]}>
            {stats.alerts}
          </Text>
          <Text style={styles.kpiSub}>Violations de permissions bloquées</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={[styles.searchBox, { borderColor: theme.border }]}>
          <Search size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t('audit_search_placeholder')}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Action Category Filter */}
        <View style={styles.filterPillGroup}>
          {[
            { id: 'ALL', label: t('audit_filter_all_actions') },
            { id: 'STAFF', label: 'Équipe & RBAC' },
            { id: 'PROPERTY', label: 'Biens Immobiliers' },
            { id: 'SECURITY', label: 'Alertes Sécurité' },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.id}
              style={[
                styles.filterPill,
                selectedAction === pill.id && styles.filterPillActive,
                { borderColor: selectedAction === pill.id ? theme.accent : theme.border },
              ]}
              onPress={() => setSelectedAction(pill.id)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: selectedAction === pill.id ? '#FFFFFF' : theme.textMuted },
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Events Table */}
      <View style={[styles.tableCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.th, { flex: 2, color: theme.textMuted }]}>{t('audit_col_time').toUpperCase()}</Text>
          <Text style={[styles.th, { flex: 2.5, color: theme.textMuted }]}>{t('audit_col_action').toUpperCase()}</Text>
          <Text style={[styles.th, { flex: 3, color: theme.textMuted }]}>{t('audit_col_actor').toUpperCase()}</Text>
          <Text style={[styles.th, { flex: 3, color: theme.textMuted }]}>{t('audit_col_target').toUpperCase()}</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: 'center', color: theme.textMuted }]}>{t('audit_col_details').toUpperCase()}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Chargement des pistes d'audit...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyBox}>
            <AlertTriangle size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun événement trouvé</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Modifiez vos critères de recherche ou réinitialisez les filtres.
            </Text>
          </View>
        ) : (
          filteredEvents.map((ev) => {
            const badge = getSeverityBadge(ev.severity);
            const dateStr = new Date(ev.timestamp).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View
                key={ev.id}
                style={[
                  styles.tableRow,
                  { borderBottomColor: theme.border },
                  ev.severity === 'ALERT' && { backgroundColor: 'rgba(239, 68, 68, 0.05)' },
                ]}
              >
                {/* Date */}
                <View style={{ flex: 2 }}>
                  <Text style={[styles.dateText, { color: theme.text }]}>{dateStr}</Text>
                  <Text style={[styles.idText, { color: theme.textMuted }]}>{ev.id}</Text>
                </View>

                {/* Action Badge */}
                <View style={{ flex: 2.5 }}>
                  <View
                    style={[
                      styles.actionBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.actionBadgeText, { color: badge.text }]}>
                      {getActionFriendlyName(ev.action)}
                    </Text>
                  </View>
                </View>

                {/* Actor */}
                <View style={{ flex: 3 }}>
                  <Text style={[styles.actorName, { color: theme.text }]}>{ev.actor.name}</Text>
                  <Text style={[styles.actorMeta, { color: theme.textMuted }]}>
                    {ev.actor.role} • {ev.actor.email}
                  </Text>
                </View>

                {/* Target */}
                <View style={{ flex: 3 }}>
                  <Text style={[styles.targetText, { color: theme.text }]} numberOfLines={2}>
                    {ev.target}
                  </Text>
                  {ev.department && (
                    <Text style={[styles.deptText, { color: theme.textMuted }]}>{ev.department}</Text>
                  )}
                </View>

                {/* Inspect Button */}
                <View style={{ flex: 1.5, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[styles.inspectBtn, { borderColor: theme.border }]}
                    onPress={() => setInspectingEvent(ev)}
                  >
                    <Eye size={14} color={theme.accent} />
                    <Text style={[styles.inspectBtnText, { color: theme.accent }]}>{t('audit_col_details')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Detail Inspection Modal */}
      {inspectingEvent && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setInspectingEvent(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.modalHeader}>
                <View style={styles.titleRow}>
                  <View style={[styles.iconBox, { backgroundColor: theme.accentLight }]}>
                    <Shield size={20} color={theme.accent} />
                  </View>
                  <View>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{t('audit_inspect_title')}</Text>
                    <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                      ID: {inspectingEvent.id}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setInspectingEvent(null)}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Date & Heure :</Text>
                  <Text style={[styles.detailVal, { color: theme.text }]}>
                    {new Date(inspectingEvent.timestamp).toISOString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Action :</Text>
                  <Text style={[styles.detailVal, { color: theme.text, fontWeight: '700' }]}>
                    {inspectingEvent.action}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Auteur :</Text>
                  <Text style={[styles.detailVal, { color: theme.text }]}>
                    {inspectingEvent.actor.name} ({inspectingEvent.actor.email}) — {inspectingEvent.actor.role}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Ressource Cible :</Text>
                  <Text style={[styles.detailVal, { color: theme.text }]}>{inspectingEvent.target}</Text>
                </View>

                {inspectingEvent.department && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Département :</Text>
                    <Text style={[styles.detailVal, { color: theme.text }]}>
                      {inspectingEvent.department}
                    </Text>
                  </View>
                )}

                <Text style={[styles.payloadTitle, { color: theme.text }]}>
                  Métadonnées & Modifications (Payload JSON) :
                </Text>
                <View style={[styles.jsonBox, { backgroundColor: isDark ? '#0B0F19' : '#F1F5F9' }]}>
                  <Text style={[styles.jsonText, { color: isDark ? '#34D399' : '#065F46' }]}>
                    {JSON.stringify(inspectingEvent.details || {}, null, 2)}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.closeModalBtn, { backgroundColor: theme.accent }]}
                  onPress={() => setInspectingEvent(null)}
                >
                  <Text style={styles.closeModalBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  toast: {
    position: 'absolute',
    top: 10,
    right: 24,
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#ECFDF5',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 16,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#059669',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  idText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  actorMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  targetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deptText: {
    fontSize: 11,
    marginTop: 1,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyBox: {
    padding: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 650,
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    paddingVertical: 10,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 13,
  },
  payloadTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  jsonBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  jsonText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  closeModalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
