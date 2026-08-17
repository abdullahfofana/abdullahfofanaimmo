import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Platform } from 'react-native';
import { Search, Filter, MoreHorizontal, Edit, Trash2, X, Shield, Mail, Plus, UserPlus, Check } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface UserData {
  id: string;
  name: string;
  email: string;
  type: 'Seller' | 'Buyer' | 'Landlord' | 'Renter';
  status: 'Active' | 'Pending' | 'Inactive';
  propertiesCount: number;
  joined: string;
  lastActive: string;
  avatar?: string;
}

const mockUsers: UserData[] = [
  { id: '1', name: 'Kouassi Marc', email: 'k.marc@immoci.ci', type: 'Seller', status: 'Active', propertiesCount: 8, joined: '2024-01-10', lastActive: 'Il y a 5 min', avatar: 'KM' },
  { id: '2', name: 'Awa Traoré', email: 'awa.traore@gmail.com', type: 'Buyer', status: 'Active', propertiesCount: 0, joined: '2024-02-05', lastActive: 'Aujourd’hui', avatar: 'AT' },
  { id: '3', name: 'Bamba Souleymane', email: 'bamba.s@cabinet-immo.ci', type: 'Landlord', status: 'Pending', propertiesCount: 3, joined: '2024-03-01', lastActive: 'Hier', avatar: 'BS' },
  { id: '4', name: 'Nathalie Koffi', email: 'nathalie.k@yahoo.fr', type: 'Renter', status: 'Inactive', propertiesCount: 0, joined: '2024-03-20', lastActive: 'Il y a 2 sem.', avatar: 'NK' },
  { id: '5', name: 'Ibrahim Diarra', email: 'diarra.ibrahim@immoci.ci', type: 'Seller', status: 'Active', propertiesCount: 15, joined: '2023-11-15', lastActive: 'Il y a 10 min', avatar: 'ID' },
];

export default function UserManagement() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme !== 'light';
  const { language } = useLanguage();

  const stitch = {
    bg: isDark ? '#0B0F19' : '#F6F8FC',
    surface: isDark ? '#161F30' : '#FFFFFF',
    surfaceHover: isDark ? '#1E293B' : '#F8FAFC',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    inputBg: isDark ? '#1E293B' : '#F8FAFC',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    tableHeaderBg: isDark ? '#111827' : '#F8FAFC',
    tableRowBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
    primary: '#059669',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
  };

  const [userList, setUserList] = useState<UserData[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Seller' | 'Buyer' | 'Landlord' | 'Renter'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending' | 'Inactive'>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Actions
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [userForm, setUserForm] = useState<Partial<UserData>>({
    name: '',
    email: '',
    type: 'Seller',
    status: 'Active',
  });

  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'All' || user.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [userList, searchQuery, typeFilter, statusFilter]);

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setUserForm(user);
    setShowEditModal(true);
    setShowActionMenu(false);
  };

  const handleDeactivateUser = (id: string) => {
    setUserList((prev) => prev.filter((u) => u.id !== id));
    setShowActionMenu(false);
  };

  const saveUser = () => {
    if (!userForm.name || !userForm.email) return;

    if (selectedUser && selectedUser.id !== 'new') {
      setUserList((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, name: userForm.name!, email: userForm.email!, type: userForm.type || u.type, status: userForm.status || u.status }
            : u
        )
      );
    } else {
      const newUser: UserData = {
        id: String(Date.now()),
        name: userForm.name!,
        email: userForm.email!,
        type: userForm.type || 'Seller',
        status: userForm.status || 'Active',
        propertiesCount: 0,
        joined: new Date().toISOString().split('T')[0],
        lastActive: 'À l’instant',
        avatar: userForm.name!.substring(0, 2).toUpperCase(),
      };
      setUserList((prev) => [newUser, ...prev]);
    }
    setShowEditModal(false);
  };

  const openActions = (user: UserData) => {
    setSelectedUser(user);
    setShowActionMenu(true);
  };

  const getTypeStyle = (type: UserData['type']) => {
    switch (type) {
      case 'Seller':
        return { bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', text: '#3B82F6' };
      case 'Buyer':
        return { bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', text: '#10B981' };
      case 'Landlord':
        return { bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', text: '#F59E0B' };
      default:
        return { bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF', text: '#8B5CF6' };
    }
  };

  const getStatusStyle = (status: UserData['status']) => {
    switch (status) {
      case 'Active':
        return { bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', text: '#10B981' };
      case 'Pending':
        return { bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', text: '#F59E0B' };
      default:
        return { bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', text: '#EF4444' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: stitch.textPrimary }]}>
            {language === 'fr' ? 'Gestion des Utilisateurs' : 'User Management'}
          </Text>
          <Text style={[styles.subtitle, { color: stitch.textSecondary }]}>
            {language === 'fr' ? 'Gérez les comptes acheteurs, vendeurs, bailleurs et locataires' : 'Manage all users, permissions and roles'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: stitch.primary }]}
          onPress={() => {
            setUserForm({ name: '', email: '', type: 'Buyer', status: 'Active' });
            setSelectedUser({ id: 'new', joined: new Date().toISOString().split('T')[0], lastActive: 'À l’instant', propertiesCount: 0 } as UserData);
            setShowEditModal(true);
          }}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{language === 'fr' ? 'Ajouter Utilisateur' : 'Add User'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <View style={[styles.searchContainer, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
          <Search size={18} color={stitch.textSecondary} />
          <TextInput
            placeholder={language === 'fr' ? 'Rechercher un utilisateur...' : 'Search users...'}
            style={[styles.searchInput, { color: stitch.textPrimary }]}
            placeholderTextColor={stitch.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: stitch.surface, borderColor: stitch.cardBorder },
            (typeFilter !== 'All' || statusFilter !== 'All') && { borderColor: stitch.primary, backgroundColor: stitch.primaryLight },
          ]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.8}
        >
          <Filter size={16} color={typeFilter !== 'All' || statusFilter !== 'All' ? stitch.primary : stitch.textPrimary} />
          <Text style={[styles.filterButtonText, { color: typeFilter !== 'All' || statusFilter !== 'All' ? stitch.primary : stitch.textPrimary }]}>
            {language === 'fr' ? 'Filtres' : 'Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Table */}
      <View style={[styles.tableContainer, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
        <View style={[styles.tableHeader, { backgroundColor: stitch.tableHeaderBg, borderBottomColor: stitch.cardBorder }]}>
          <Text style={[styles.tableHead, { flex: 2.2, color: stitch.textSecondary }]}>Utilisateur</Text>
          <Text style={[styles.tableHead, { flex: 2, color: stitch.textSecondary }]}>Email</Text>
          <Text style={[styles.tableHead, { flex: 1.2, color: stitch.textSecondary }]}>Type</Text>
          <Text style={[styles.tableHead, { flex: 1, color: stitch.textSecondary }]}>Statut</Text>
          <Text style={[styles.tableHead, { flex: 1, textAlign: 'center', color: stitch.textSecondary }]}>Biens</Text>
          <Text style={[styles.tableHead, { flex: 1.3, color: stitch.textSecondary }]}>Inscrit le</Text>
          <Text style={[styles.tableHead, { flex: 1.3, color: stitch.textSecondary }]}>Dernière activité</Text>
          <Text style={[styles.tableHead, { flex: 0.6, textAlign: 'right', color: stitch.textSecondary }]}>Actions</Text>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: stitch.textSecondary }]}>
              {language === 'fr' ? 'Aucun utilisateur trouvé.' : 'No users found matching your criteria.'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            const typeStyle = getTypeStyle(user.type);
            const statusStyle = getStatusStyle(user.status);

            return (
              <View key={user.id} style={[styles.tableRow, { borderBottomColor: stitch.tableRowBorder }]}>
                {/* User Column */}
                <View style={[styles.tableCellView, { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                  <View style={[styles.avatar, { backgroundColor: stitch.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: stitch.primary }]}>
                      {user.avatar || user.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.userName, { color: stitch.textPrimary }]} numberOfLines={1}>
                    {user.name}
                  </Text>
                </View>

                {/* Email Column */}
                <Text style={[styles.tableCell, { flex: 2, color: stitch.textSecondary }]} numberOfLines={1}>
                  {user.email}
                </Text>

                {/* Type Column */}
                <View style={[styles.tableCellView, { flex: 1.2 }]}>
                  <View style={[styles.pill, { backgroundColor: typeStyle.bg }]}>
                    <Text style={[styles.pillText, { color: typeStyle.text }]}>{user.type}</Text>
                  </View>
                </View>

                {/* Status Column */}
                <View style={[styles.tableCellView, { flex: 1 }]}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{user.status}</Text>
                  </View>
                </View>

                {/* Properties Column */}
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: stitch.textPrimary }]}>
                  {user.propertiesCount}
                </Text>

                {/* Joined Column */}
                <Text style={[styles.tableCell, { flex: 1.3, color: stitch.textMuted }]}>{user.joined}</Text>

                {/* Last Active Column */}
                <Text style={[styles.tableCell, { flex: 1.3, color: stitch.textMuted }]}>{user.lastActive}</Text>

                {/* Actions Column */}
                <TouchableOpacity
                  style={[styles.tableCellView, { flex: 0.6, alignItems: 'flex-end' }]}
                  onPress={() => openActions(user)}
                >
                  <MoreHorizontal size={18} color={stitch.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* Edit User Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
            <View style={[styles.modalHeader, { borderBottomColor: stitch.cardBorder }]}>
              <View>
                <Text style={[styles.modalTitle, { color: stitch.textPrimary }]}>
                  {selectedUser?.id === 'new' ? 'Ajouter Utilisateur' : 'Modifier Utilisateur'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: stitch.textSecondary }]}>
                  Mettez à jour les informations du profil
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={20} color={stitch.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitch.textPrimary }]}>Nom complet</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder, color: stitch.textPrimary }]}
                  value={userForm.name}
                  onChangeText={(t) => setUserForm((prev) => ({ ...prev, name: t }))}
                  placeholder="Ex: Kouamé Jean"
                  placeholderTextColor={stitch.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitch.textPrimary }]}>Adresse Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: stitch.inputBg, borderColor: stitch.inputBorder, color: stitch.textPrimary }]}
                  value={userForm.email}
                  onChangeText={(t) => setUserForm((prev) => ({ ...prev, email: t }))}
                  keyboardType="email-address"
                  placeholder="email@immoci.ci"
                  placeholderTextColor={stitch.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitch.textPrimary }]}>Type de compte</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {(['Seller', 'Buyer', 'Landlord', 'Renter'] as UserData['type'][]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.choicePill,
                        { borderColor: stitch.inputBorder, backgroundColor: stitch.inputBg },
                        userForm.type === t && { borderColor: stitch.primary, backgroundColor: stitch.primaryLight },
                      ]}
                      onPress={() => setUserForm((prev) => ({ ...prev, type: t }))}
                    >
                      <Text style={[{ fontSize: 13, color: stitch.textSecondary }, userForm.type === t && { color: stitch.primary, fontWeight: '700' }]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: stitch.textPrimary }]}>Statut</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['Active', 'Pending', 'Inactive'] as UserData['status'][]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.choicePill,
                        { borderColor: stitch.inputBorder, backgroundColor: stitch.inputBg },
                        userForm.status === s && { borderColor: stitch.primary, backgroundColor: stitch.primaryLight },
                      ]}
                      onPress={() => setUserForm((prev) => ({ ...prev, status: s }))}
                    >
                      <Text style={[{ fontSize: 13, color: stitch.textSecondary }, userForm.status === s && { color: stitch.primary, fontWeight: '700' }]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: stitch.cardBorder }]}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: stitch.inputBorder }]} onPress={() => setShowEditModal(false)}>
                <Text style={[styles.cancelButtonText, { color: stitch.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: stitch.primary }]} onPress={saveUser}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Menu Modal */}
      <Modal visible={showActionMenu} transparent animationType="none" onRequestClose={() => setShowActionMenu(false)}>
        <TouchableOpacity style={styles.actionMenuOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
          <View style={[styles.actionMenu, { backgroundColor: stitch.surface, borderColor: stitch.cardBorder }]}>
            <TouchableOpacity style={styles.actionMenuItem} onPress={() => selectedUser && handleEditUser(selectedUser)}>
              <Edit size={16} color={stitch.textPrimary} />
              <Text style={[styles.actionMenuText, { color: stitch.textPrimary }]}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionMenuItem, { borderTopWidth: 1, borderTopColor: stitch.cardBorder }]}
              onPress={() => selectedUser && handleDeactivateUser(selectedUser.id)}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={[styles.actionMenuText, { color: '#EF4444' }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    flex: 1,
    maxWidth: 340,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 10,
    height: 42,
  },
  filterButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  tableContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableHead: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 13,
  },
  tableCellView: {
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  emptyState: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
    gap: 14,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenu: {
    width: 180,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionMenuText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
