/**
 * ImmoCI — Staff Access & Granular Permissions Modal (RBAC)
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Shield,
  Check,
  RotateCcw,
  CheckCheck,
  AlertCircle,
  Building2,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  LayoutDashboard,
} from 'lucide-react-native';

import {
  StaffAccount,
  StaffRole,
  PermissionKey,
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  ROLE_DEFAULT_PERMISSIONS,
} from '@/types/staffRbac';

interface StaffAccessModalProps {
  visible: boolean;
  staff: StaffAccount | null;
  isDark?: boolean;
  onClose: () => void;
  onSave: (updatedStaff: StaffAccount) => Promise<void> | void;
}

const ROLES_LIST: { role: StaffRole; label: string; desc: string }[] = [
  {
    role: 'Super Admin',
    label: 'Super Admin',
    desc: 'Accès administratif total et illimité à tous les modules.',
  },
  {
    role: 'Admin',
    label: 'Administrateur',
    desc: 'Gestion des annonces, clients, demandes et exports de rapports.',
  },
  {
    role: 'Customer Care',
    label: 'Customer Care (Support Client)',
    desc: 'Gestion des discussions en direct, demandes d’assistance et suivi client.',
  },
  {
    role: 'Property Manager',
    label: 'Gestionnaire Immobilier',
    desc: 'Validation, modération cadastrale (ACD) et gestion des mandats.',
  },
  {
    role: 'Sales',
    label: 'Commercial & Ventes',
    desc: 'Suivi des prospects, visites et discussions commerciales.',
  },
];

export default function StaffAccessModal({
  visible,
  staff,
  isDark = true,
  onClose,
  onSave,
}: StaffAccessModalProps) {
  const { language } = useLanguage();
  if (!staff) return null;

  const [currentRole, setCurrentRole] = useState<StaffRole>(staff.role);
  const [currentStatus, setCurrentStatus] = useState<'Active' | 'Inactive'>(staff.status);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<PermissionKey>>(
    new Set(staff.permissions || ROLE_DEFAULT_PERMISSIONS[staff.role] || [])
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  // Sync state when staff changes
  useEffect(() => {
    if (staff) {
      setCurrentRole(staff.role);
      setCurrentStatus(staff.status);
      setSelectedPermissions(
        new Set(staff.permissions || ROLE_DEFAULT_PERMISSIONS[staff.role] || [])
      );
    }
  }, [staff]);

  const handleRoleSelect = (newRole: StaffRole) => {
    setCurrentRole(newRole);
    // Apply recommended defaults for new role
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[newRole] || [];
    setSelectedPermissions(new Set(defaultPerms));
    setShowRolePicker(false);
  };

  const togglePermission = (key: PermissionKey) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleResetToDefaults = () => {
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[currentRole] || [];
    setSelectedPermissions(new Set(defaultPerms));
  };

  const handleSelectAll = () => {
    setSelectedPermissions(new Set(ALL_PERMISSIONS.map((p) => p.key)));
  };

  const handleClearAll = () => {
    setSelectedPermissions(new Set());
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: StaffAccount = {
        ...staff,
        role: currentRole,
        status: currentStatus,
        permissions: Array.from(selectedPermissions),
      };
      await onSave(updated);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'dashboard':
        return <LayoutDashboard size={16} color="#059669" />;
      case 'properties':
        return <Building2 size={16} color="#3B82F6" />;
      case 'customers':
        return <Users size={16} color="#8B5CF6" />;
      case 'inquiries':
        return <FileText size={16} color="#F59E0B" />;
      case 'chat':
        return <MessageSquare size={16} color="#10B981" />;
      case 'reports':
        return <BarChart3 size={16} color="#06B6D4" />;
      case 'staff':
        return <Shield size={16} color="#EC4899" />;
      case 'settings':
        return <Settings size={16} color="#64748B" />;
      default:
        return <Shield size={16} color="#059669" />;
    }
  };

  const theme = {
    overlay: 'rgba(5, 10, 15, 0.75)',
    modalBg: isDark ? '#111827' : '#FFFFFF',
    border: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E2E8F0',
    cardBg: isDark ? '#161F30' : '#F8FAFC',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#059669',
    primaryLight: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
  };

  const grantedCount = selectedPermissions.size;
  const totalCount = ALL_PERMISSIONS.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.modalBg,
              borderColor: theme.border,
            },
          ]}
        >
          {/* ── HEADER ── */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{staff.avatar || staff.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                    {staff.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          currentStatus === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: currentStatus === 'Active' ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {currentStatus === 'Active' ? 'Compte Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                  {staff.email} • {staff.department}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── BODY SCROLL ── */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Role and Status Selector Row */}
            <View style={styles.roleStatusRow}>
              {/* Role Picker */}
              <View style={{ flex: 1.5 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  RÔLE ATTRIBUÉ (RBAC)
                </Text>
                <TouchableOpacity
                  style={[
                    styles.roleDropdownBtn,
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                  ]}
                  onPress={() => setShowRolePicker(!showRolePicker)}
                  activeOpacity={0.8}
                >
                  <Shield size={16} color="#059669" />
                  <Text style={[styles.roleDropdownText, { color: theme.textPrimary }]}>
                    {currentRole}
                  </Text>
                </TouchableOpacity>

                {showRolePicker && (
                  <View
                    style={[
                      styles.roleDropdownList,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                    ]}
                  >
                    {ROLES_LIST.map((r) => (
                      <TouchableOpacity
                        key={r.role}
                        style={[
                          styles.roleDropdownItem,
                          currentRole === r.role && { backgroundColor: theme.primaryLight },
                        ]}
                        onPress={() => handleRoleSelect(r.role)}
                        activeOpacity={0.75}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.roleDropdownItemTitle,
                              { color: currentRole === r.role ? '#059669' : theme.textPrimary },
                            ]}
                          >
                            {r.label}
                          </Text>
                          <Text style={[styles.roleDropdownItemDesc, { color: theme.textMuted }]}>
                            {r.desc}
                          </Text>
                        </View>
                        {currentRole === r.role && <Check size={16} color="#059669" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Status Toggle */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  {language === 'en' ? 'ACCOUNT STATUS' : 'STATUT DU COMPTE'}
                </Text>
                <View
                  style={[
                    styles.statusToggleWrap,
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.statusToggleOption,
                      currentStatus === 'Active' && styles.statusToggleOptionActive,
                    ]}
                    onPress={() => setCurrentStatus('Active')}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        { color: currentStatus === 'Active' ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      Actif
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleOption,
                      currentStatus === 'Inactive' && styles.statusToggleOptionInactive,
                    ]}
                    onPress={() => setCurrentStatus('Inactive')}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        { color: currentStatus === 'Inactive' ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      Inactif
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Actions & Counter Banner */}
            <View
              style={[
                styles.summaryBanner,
                { backgroundColor: theme.primaryLight, borderColor: 'rgba(5, 150, 105, 0.25)' },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Shield size={18} color="#059669" strokeWidth={2.4} />
                <View>
                  <Text style={[styles.summaryTitle, { color: '#065F46' }]}>
                    {grantedCount} sur {totalCount} permissions accordées
                  </Text>
                  <Text style={[styles.summarySub, { color: '#047857' }]}>
                    Les droits cochés s'appliquent immédiatement à la connexion du collaborateur.
                  </Text>
                </View>
              </View>

              <View style={styles.quickActionGroup}>
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}
                  onPress={handleResetToDefaults}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={13} color="#059669" />
                  <Text style={[styles.quickBtnText, { color: '#059669' }]}>
                    Par défaut ({currentRole})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}
                  onPress={handleSelectAll}
                  activeOpacity={0.8}
                >
                  <CheckCheck size={13} color={theme.textPrimary} />
                  <Text style={[styles.quickBtnText, { color: theme.textPrimary }]}>Tout cocher</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}
                  onPress={handleClearAll}
                  activeOpacity={0.8}
                >
                  <X size={13} color="#EF4444" />
                  <Text style={[styles.quickBtnText, { color: '#EF4444' }]}>Tout effacer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Granular Permission Checklist by Category */}
            <View style={styles.categoriesContainer}>
              {PERMISSION_CATEGORIES.map((cat) => {
                const perms = ALL_PERMISSIONS.filter((p) => p.category === cat.id);
                const catGranted = perms.filter((p) => selectedPermissions.has(p.key)).length;

                return (
                  <View
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      },
                    ]}
                  >
                    {/* Category Title */}
                    <View style={styles.categoryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {getCategoryIcon(cat.id)}
                        <Text style={[styles.categoryTitleText, { color: theme.textPrimary }]}>
                          {cat.titleFr}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.catBadge,
                          {
                            backgroundColor:
                              catGranted === perms.length
                                ? 'rgba(16, 185, 129, 0.15)'
                                : catGranted > 0
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(100, 116, 139, 0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.catBadgeText,
                            {
                              color:
                                catGranted === perms.length
                                  ? '#10B981'
                                  : catGranted > 0
                                  ? '#3B82F6'
                                  : theme.textMuted,
                            },
                          ]}
                        >
                          {catGranted}/{perms.length}
                        </Text>
                      </View>
                    </View>

                    {/* Permissions Grid in Category */}
                    <View style={styles.permsGrid}>
                      {perms.map((perm) => {
                        const isGranted = selectedPermissions.has(perm.key);

                        return (
                          <TouchableOpacity
                            key={perm.key}
                            style={[
                              styles.permItemRow,
                              isGranted && styles.permItemRowActive,
                              { borderColor: isGranted ? '#059669' : theme.border },
                            ]}
                            onPress={() => togglePermission(perm.key)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                isGranted && styles.checkboxActive,
                                { borderColor: isGranted ? '#059669' : theme.textMuted },
                              ]}
                            >
                              {isGranted && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.permLabel,
                                  { color: isGranted ? theme.textPrimary : theme.textSecondary },
                                ]}
                              >
                                {perm.labelFr}
                              </Text>
                              <Text style={[styles.permDesc, { color: theme.textMuted }]}>
                                {perm.descriptionFr}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* ── FOOTER ── */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>{language === 'en' ? 'Cancel' : 'Annuler'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.saveBtnText}>Enregistrer les permissions</Text>
                </>
              )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 860,
    maxHeight: '92%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  roleStatusRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  roleDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleDropdownText: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleDropdownList: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  roleDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  roleDropdownItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleDropdownItemDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  statusToggleWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    height: 46,
  },
  statusToggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  statusToggleOptionActive: {
    backgroundColor: '#059669',
  },
  statusToggleOptionInactive: {
    backgroundColor: '#EF4444',
  },
  statusToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  quickActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  quickBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  categoriesContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  categoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryTitleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  permsGrid: {
    gap: 8,
  },
  permItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  permItemRowActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#059669',
  },
  permLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  permDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 11,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
