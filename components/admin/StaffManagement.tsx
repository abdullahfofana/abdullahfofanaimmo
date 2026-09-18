import { useLanguage } from '@/providers/LanguageProvider';
/**
 * ImmoCI — Staff Access Management & RBAC Panel
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
} from 'react-native';
import {
  Users,
  Shield,
  Plus,
  Key,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  SlidersHorizontal,
  Mail,
  Phone,
  Building,
  UserCheck,
  Check,
  X,
} from 'lucide-react-native';

import {
  StaffAccount,
  StaffRole,
  DepartmentType,
  ROLE_DEFAULT_PERMISSIONS,
} from '@/types/staffRbac';
import {
  loadStaffAccounts,
  updateStaffMember,
  addStaffMember,
} from '@/utils/staffStorage';
import { logAuditEvent } from '@/utils/auditLogger';
import StaffAccessModal from './StaffAccessModal';

interface StaffManagementProps {
  isDark?: boolean;
}

const DEPARTMENTS: (string | DepartmentType)[] = [
  'All',
  'Platform Administration',
  'Customer Support',
  'Operations & Logistics',
  'Sales & Commercial',
  'Legal & Compliance',
  'Finance & Billing',
];

const ROLES: (string | StaffRole)[] = [
  'All',
  'Super Admin',
  'Admin',
  'Customer Care',
  'Property Manager',
  'Sales',
];

export default function StaffManagement({ isDark = true }: StaffManagementProps) {
  const { language, t } = useLanguage();
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');

  // Modal states
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New staff form state
  const [newStaff, setNewStaff] = useState<{
    name: string;
    email: string;
    phone: string;
    role: StaffRole;
    department: DepartmentType;
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'Customer Care',
    department: 'Customer Support',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await loadStaffAccounts();
      setStaffList(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadStaff();
  }, []);

  const handleSaveAccess = async (updated: StaffAccount) => {
    await updateStaffMember(updated);
    await reloadStaff();
    logAuditEvent({
      action: 'STAFF_PERMISSIONS_CHANGED',
      severity: 'WARNING',
      actor: { id: 'admin-actor', name: 'Administrateur', email: 'admin@immoci.ci', role: 'Admin' },
      target: `${updated.name} (${updated.email})`,
      department: updated.department,
      details: {
        role: updated.role,
        permissionsCount: updated.permissions.length,
        status: updated.status,
      },
    });
    showToast(`Permissions de ${updated.name} mises à jour avec succès.`);
  };

  const handleCreateStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.email.trim()) return;

    const created = await addStaffMember({
      name: newStaff.name.trim(),
      email: newStaff.email.trim().toLowerCase(),
      phone: newStaff.phone.trim() || '+225 07 00 00 00 00',
      role: newStaff.role,
      department: newStaff.department,
      status: 'Active',
      hireDate: new Date().toISOString().split('T')[0],
      lastActive: 'À l’instant',
      avatar: newStaff.name.slice(0, 2).toUpperCase(),
    });

    logAuditEvent({
      action: 'STAFF_CREATED',
      severity: 'INFO',
      actor: { id: 'admin-actor', name: 'Administrateur', email: 'admin@immoci.ci', role: 'Admin' },
      target: `${created.name} (${created.email})`,
      department: created.department,
      details: {
        role: created.role,
        department: created.department,
        status: created.status,
      },
    });

    setShowAddModal(false);
    setNewStaff({
      name: '',
      email: '',
      phone: '',
      role: 'Customer Care',
      department: 'Customer Support',
    });
    await reloadStaff();
    showToast(`Nouveau collaborateur ${created.name} ajouté.`);
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (selectedDept !== 'All' && s.department !== selectedDept) return false;
      if (selectedRole !== 'All' && s.role !== selectedRole) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchEmail = s.email.toLowerCase().includes(q);
        const matchRole = s.role.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRole) return false;
      }
      return true;
    });
  }, [staffList, selectedDept, selectedRole, searchQuery]);

  const theme = {
    bg: isDark ? '#0B0F19' : '#F6F8FC',
    surface: isDark ? '#161F30' : '#FFFFFF',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#059669',
    primaryLight: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
  };

  const getRoleBadgeStyle = (role: StaffRole) => {
    switch (role) {
      case 'Super Admin':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Admin':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Customer Care':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Property Manager':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'Sales':
        return { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#94A3B8', border: 'rgba(100, 116, 139, 0.3)' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <Sparkles size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ── HEADER & ACTIONS ── */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
              <Shield size={20} color="#059669" strokeWidth={2.4} />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Gestion des Accès & Équipe (RBAC)
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {language === 'ar' ? 'التحكم في وصول الموظفين والأدوار والصلاحيات الدقيقة لفريق ImmoCI.' : language === 'en' ? 'Role-based access control and granular permissions for ImmoCI team.' : "Contrôle d'accès basé sur les rôles et permissions granulaires pour les collaborateurs ImmoCI."}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>{language === 'ar' ? 'إضافة موظف جديد' : language === 'en' ? 'Add Staff Member' : 'Ajouter un collaborateur'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── KPI METRICS SUMMARY ROW ── */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{language === 'ar' ? 'إجمالي الموظفين' : language === 'en' ? 'TOTAL STAFF' : 'TOTAL COLLABORATEURS'}</Text>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{staffList.length}</Text>
          <Text style={[styles.kpiSub, { color: '#059669' }]}>
            {staffList.filter((s) => s.status === 'Active').length} actifs • 100% sécurisé
          </Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{language === 'ar' ? 'خدمة العملاء' : 'CUSTOMER CARE'}</Text>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            {staffList.filter((s) => s.role === 'Customer Care').length}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
            Support direct & chat acheteurs
          </Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{language === 'ar' ? 'مديرو العقارات' : language === 'en' ? 'PROPERTY MANAGERS' : 'GESTIONNAIRES IMMOBILIERS'}</Text>
          <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>
            {staffList.filter((s) => s.role === 'Property Manager').length}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
            Modération & certification ACD
          </Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{language === 'ar' ? 'الإدارة والإشراف' : language === 'en' ? 'ADMINISTRATORS' : 'ADMINISTRATEURS'}</Text>
          <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>
            {staffList.filter((s) => s.role === 'Admin' || s.role === 'Super Admin').length}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
            Direction & supervision générale
          </Text>
        </View>
      </View>

      {/* ── FILTERS BAR ── */}
      <View style={[styles.filterBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Search */}
        <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          <Search size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={language === 'ar' ? 'بحث بالاسم، البريد، أو الدور...' : language === 'en' ? 'Search by name, email, or role...' : 'Rechercher par nom, email ou rôle...'}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Role Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {ROLES.map((r) => {
            const isSelected = selectedRole === r;
            return (
              <TouchableOpacity
                key={r}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? '#059669' : isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isSelected ? '#059669' : theme.border,
                  },
                ]}
                onPress={() => setSelectedRole(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                  {r === 'All' ? 'Tous les rôles' : r}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── STAFF TABLE ── */}
      <View style={[styles.tableCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeaderRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.colHeader, { flex: 2.2, color: theme.textSecondary }]}>COLLABORATEUR</Text>
          <Text style={[styles.colHeader, { flex: 1.4, color: theme.textSecondary }]}>RÔLE ATTRIBUÉ</Text>
          <Text style={[styles.colHeader, { flex: 1.6, color: theme.textSecondary }]}>DÉPARTEMENT</Text>
          <Text style={[styles.colHeader, { flex: 1.0, color: theme.textSecondary }]}>STATUT</Text>
          <Text style={[styles.colHeader, { flex: 1.5, color: theme.textSecondary }]}>PERMISSIONS</Text>
          <Text style={[styles.colHeader, { flex: 1.4, color: theme.textSecondary, textAlign: 'right' }]}>ACTIONS</Text>
        </View>

        {/* Table Body */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : filteredStaff.length === 0 ? (
          <View style={styles.emptyBox}>
            <Users size={36} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun collaborateur ne correspond à vos filtres.
            </Text>
          </View>
        ) : (
          filteredStaff.map((member) => {
            const roleBadge = getRoleBadgeStyle(member.role);
            const permCount = member.permissions?.length || 0;

            return (
              <View
                key={member.id}
                style={[styles.tableRow, { borderBottomColor: theme.border }]}
              >
                {/* Staff Member */}
                <View style={[styles.staffCell, { flex: 2.2 }]}>
                  <View style={styles.tableAvatar}>
                    <Text style={styles.tableAvatarText}>
                      {member.avatar || member.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.staffName, { color: theme.textPrimary }]}>{member.name}</Text>
                    <Text style={[styles.staffEmail, { color: theme.textMuted }]}>{member.email}</Text>
                  </View>
                </View>

                {/* Role */}
                <View style={{ flex: 1.4, justifyContent: 'center' }}>
                  <View
                    style={[
                      styles.badgeBox,
                      {
                        backgroundColor: roleBadge.bg,
                        borderColor: roleBadge.border,
                      },
                    ]}
                  >
                    <Shield size={12} color={roleBadge.text} />
                    <Text style={[styles.badgeText, { color: roleBadge.text }]}>{member.role}</Text>
                  </View>
                </View>

                {/* Department */}
                <View style={{ flex: 1.6, justifyContent: 'center' }}>
                  <Text style={[styles.deptText, { color: theme.textSecondary }]}>
                    {member.department}
                  </Text>
                </View>

                {/* Status */}
                <View style={{ flex: 1.0, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: member.status === 'Active' ? '#10B981' : '#EF4444' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusLabel,
                        { color: member.status === 'Active' ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {member.status === 'Active' ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>

                {/* Permissions Count */}
                <View style={{ flex: 1.5, justifyContent: 'center' }}>
                  <View
                    style={[
                      styles.permCountBadge,
                      {
                        backgroundColor:
                          permCount >= 20
                            ? 'rgba(5, 150, 105, 0.12)'
                            : permCount >= 10
                            ? 'rgba(59, 130, 246, 0.12)'
                            : 'rgba(100, 116, 139, 0.12)',
                      },
                    ]}
                  >
                    <Key size={11} color="#059669" />
                    <Text style={styles.permCountText}>
                      {permCount} / 25 droits
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flex: 1.4, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setEditingStaff(member)}
                    activeOpacity={0.8}
                  >
                    <Key size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Gérer accès</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── MODAL 1: EDIT ACCESS MODAL ── */}
      <StaffAccessModal
        visible={!!editingStaff}
        staff={editingStaff}
        isDark={isDark}
        onClose={() => setEditingStaff(null)}
        onSave={handleSaveAccess}
      />

      {/* ── MODAL 2: ADD STAFF MODAL ── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.addModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Plus size={20} color="#059669" strokeWidth={2.5} />
                <Text style={[styles.addModalTitle, { color: theme.textPrimary }]}>
                  Ajouter un nouveau collaborateur
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.addModalBody}>
              {/* Name */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>NOM COMPLET</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="ex: Mamadou Kouassi"
                placeholderTextColor={theme.textMuted}
                value={newStaff.name}
                onChangeText={(v) => setNewStaff((prev) => ({ ...prev, name: v }))}
              />

              {/* Email */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>EMAIL PROFESSIONNEL</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="ex: mamadou.k@immoci.ci"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={newStaff.email}
                onChangeText={(v) => setNewStaff((prev) => ({ ...prev, email: v }))}
              />

              {/* Phone */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>TÉLÉPHONE MOBILE</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="ex: +225 07 12 34 56 78"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                value={newStaff.phone}
                onChangeText={(v) => setNewStaff((prev) => ({ ...prev, phone: v }))}
              />

              {/* Role Selection */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>RÔLE ATTRIBUÉ</Text>
              <View style={styles.rolePickerRow}>
                {(['Customer Care', 'Property Manager', 'Sales', 'Admin'] as StaffRole[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOptionBtn,
                      newStaff.role === r && styles.roleOptionBtnActive,
                    ]}
                    onPress={() => setNewStaff((prev) => ({ ...prev, role: r }))}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        { color: newStaff.role === r ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Department Selection */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>DÉPARTEMENT</Text>
              <View style={styles.deptPickerRow}>
                {[
                  'Customer Support',
                  'Operations & Logistics',
                  'Sales & Commercial',
                  'Legal & Compliance',
                ].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.deptOptionBtn,
                      newStaff.department === d && styles.deptOptionBtnActive,
                    ]}
                    onPress={() => setNewStaff((prev) => ({ ...prev, department: d as DepartmentType }))}
                  >
                    <Text
                      style={[
                        styles.deptOptionText,
                        { color: newStaff.department === d ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!newStaff.name || !newStaff.email) && { opacity: 0.5 }]}
                onPress={handleCreateStaff}
                disabled={!newStaff.name || !newStaff.email}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.saveBtnText}>Créer le collaborateur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  toast: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    width: 280,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  pillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 12,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  staffCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  staffName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  staffEmail: {
    fontSize: 11.5,
    marginTop: 1,
  },
  badgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deptText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  permCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  permCountText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 15, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addModalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  addModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  addModalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputField: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleOptionBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  roleOptionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  deptPickerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  deptOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deptOptionBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  deptOptionText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
