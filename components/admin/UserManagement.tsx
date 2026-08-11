import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import { Search, Filter, MoreHorizontal, Edit, Trash2, X, Shield, Mail } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';

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
  { id: '1', name: 'John Doe', email: 'john@example.com', type: 'Seller', status: 'Active', propertiesCount: 3, joined: '2024-01-10', lastActive: '2024-06-15', avatar: 'JD' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', type: 'Buyer', status: 'Active', propertiesCount: 0, joined: '2024-02-05', lastActive: '2024-06-16', avatar: 'JS' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', type: 'Landlord', status: 'Pending', propertiesCount: 1, joined: '2024-03-01', lastActive: '2024-06-14', avatar: 'BJ' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', type: 'Renter', status: 'Inactive', propertiesCount: 0, joined: '2024-03-20', lastActive: '2024-05-30', avatar: 'AW' },
  { id: '5', name: 'David Brown', email: 'david@example.com', type: 'Seller', status: 'Active', propertiesCount: 12, joined: '2023-11-15', lastActive: '2024-06-16', avatar: 'DB' },
];

import { trpc } from '@/lib/trpc';

export default function UserManagement() {
  const utils = trpc.useUtils();
  const { data: usersData, isLoading, refetch } = trpc.users.list.useQuery();
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      refetch();
    }
  });
  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      refetch();
    }
  });
  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      refetch();
    }
  });

  const users = useMemo(() => usersData || [], [usersData]);

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
    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'All' || user.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [users, searchQuery, typeFilter, statusFilter]);

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setUserForm(user);
    setShowEditModal(true);
    setShowActionMenu(false);
  };

  const handleDeactivateUser = (id: string) => {
    const confirmDelete = async () => {
      try {
        await deleteUserMutation.mutateAsync({ id });
      } catch (error) {
        if (Platform.OS === 'web') {
          alert('Failed to delete user');
        } else {
          Alert.alert('Error', 'Failed to delete user');
        }
      }
      setShowActionMenu(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this user?')) {
        confirmDelete();
      }
    } else {
      Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]);
    }
  };

  const saveUser = async () => {
    if (!userForm.name || !userForm.email) return;

    try {
      if (selectedUser && selectedUser.id !== 'new') {
        // Update existing
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          name: userForm.name,
          email: userForm.email,
          type: userForm.type,
          status: userForm.status,
        });
      } else {
        // Create new
        await createUserMutation.mutateAsync({
          name: userForm.name,
          email: userForm.email,
          type: userForm.type || 'Seller',
          status: userForm.status || 'Active',
        });
      }
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      if (Platform.OS === 'web') {
        alert('Failed to save user details');
      } else {
        Alert.alert('Error', 'Failed to save user details');
      }
    }
  };

  const openActions = (user: UserData) => {
    setSelectedUser(user);
    setShowActionMenu(true);
  };

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Manage Users</Text>
          <Text style={styles.subtitle}>Manage all users on the platform</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setUserForm({ name: '', email: '', type: 'Buyer', status: 'Active' });
            setSelectedUser({ id: 'new', joined: new Date().toISOString().split('T')[0], lastActive: 'Just now', propertiesCount: 0 } as UserData);
            setShowEditModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            placeholder="Search users..."
            style={styles.searchInput}
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, (typeFilter !== 'All' || statusFilter !== 'All') && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={Colors.text} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* User Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHead, { flex: 2 }]}>User</Text>
          <Text style={[styles.tableHead, { flex: 2 }]}>Email</Text>
          <Text style={[styles.tableHead, { flex: 1 }]}>Type</Text>
          <Text style={[styles.tableHead, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHead, { flex: 1, textAlign: 'center' }]}>Properties</Text>
          <Text style={[styles.tableHead, { flex: 1.5 }]}>Joined</Text>
          <Text style={[styles.tableHead, { flex: 1.5 }]}>Last Active</Text>
          <Text style={[styles.tableHead, { flex: 0.5, textAlign: 'right' }]}>Action</Text>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No users found matching your criteria.</Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user.id} style={styles.tableRow}>
              {/* User Column */}
              <View style={[styles.tableCellView, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.avatar || user.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                </View>
              </View>

              {/* Email Column */}
              <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{user.email}</Text>

              {/* Type Column */}
              <View style={[styles.tableCellView, { flex: 1 }]}>
                <View style={[
                  styles.pill,
                  user.type === 'Seller' ? styles.pillSeller :
                    user.type === 'Buyer' ? styles.pillBuyer :
                      user.type === 'Landlord' ? styles.pillLandlord : styles.pillRenter
                ]}>
                  <Text style={[
                    styles.pillText,
                    user.type === 'Seller' ? styles.pillTextSeller :
                      user.type === 'Buyer' ? styles.pillTextBuyer :
                        user.type === 'Landlord' ? styles.pillTextLandlord : styles.pillTextRenter
                  ]}>
                    {user.type}
                  </Text>
                </View>
              </View>

              {/* Status Column */}
              <View style={[styles.tableCellView, { flex: 1 }]}>
                <View style={[
                  styles.statusBadge,
                  user.status === 'Active' ? styles.statusActive :
                    user.status === 'Pending' ? styles.statusPending : styles.statusInactive
                ]}>
                  <Text style={[
                    styles.statusText,
                    user.status === 'Active' ? styles.statusTextActive :
                      user.status === 'Pending' ? styles.statusTextPending : styles.statusTextInactive
                  ]}>{user.status}</Text>
                </View>
              </View>

              {/* Properties Column */}
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{user.propertiesCount}</Text>

              {/* Joined Column */}
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{user.joined}</Text>

              {/* Last Active Column */}
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{user.lastActive}</Text>

              {/* Actions Column */}
              <TouchableOpacity
                style={[styles.tableCellView, { flex: 0.5, alignItems: 'flex-end' }]}
                onPress={() => openActions(user)}
              >
                <MoreHorizontal size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit User</Text>
                <Text style={styles.modalSubtitle}>Make changes to the user&apos;s profile information here.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={userForm.name}
                  onChangeText={(t) => setUserForm(prev => ({ ...prev, name: t }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={userForm.email}
                  onChangeText={(t) => setUserForm(prev => ({ ...prev, email: t }))}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      const types: UserData['type'][] = ['Seller', 'Buyer', 'Landlord', 'Renter'];
                      const nextIndex = (types.indexOf(userForm.type as any) + 1) % types.length;
                      setUserForm(prev => ({ ...prev, type: types[nextIndex] }));
                    }}
                  >
                    <Text style={styles.selectButtonText}>{userForm.type}</Text>
                    {/* In a real app, this would trigger a dropdown */}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      const statuses: UserData['status'][] = ['Active', 'Pending', 'Inactive'];
                      const nextIndex = (statuses.indexOf(userForm.status as any) + 1) % statuses.length;
                      setUserForm(prev => ({ ...prev, status: statuses[nextIndex] }));
                    }}
                  >
                    <Text style={styles.selectButtonText}>{userForm.status}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveUser}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Menu Modal (Simplified implementation of a dropdown/popover) */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.actionMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.actionMenu}>
            <TouchableOpacity style={styles.actionMenuItem} onPress={() => { setShowActionMenu(false); /* Nav to profile */ }}>
              <Shield size={16} color={Colors.text} />
              <Text style={styles.actionMenuText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionMenuItem} onPress={() => { setShowActionMenu(false); /* Send Message */ }}>
              <Mail size={16} color={Colors.text} />
              <Text style={styles.actionMenuText}>Send Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionMenuItem} onPress={() => selectedUser && handleEditUser(selectedUser)}>
              <Edit size={16} color={Colors.text} />
              <Text style={styles.actionMenuText}>Edit User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionMenuItem, styles.actionMenuDelete]} onPress={() => selectedUser && handleDeactivateUser(selectedUser.id)}>
              <Trash2 size={16} color={Colors.error} />
              <Text style={styles.actionMenuDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Users</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}><X size={20} color={Colors.textSecondary} /></TouchableOpacity>
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.filterOptions}>
                {(['All', 'Seller', 'Buyer', 'Landlord', 'Renter'] as const).map(t => (
                  <TouchableOpacity key={t} style={[styles.filterChip, typeFilter === t && styles.filterChipActive]} onPress={() => setTypeFilter(t)}>
                    <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.filterOptions}>
                {(['All', 'Active', 'Pending', 'Inactive'] as const).map(s => (
                  <TouchableOpacity key={s} style={[styles.filterChip, statusFilter === s && styles.filterChipActive]} onPress={() => setStatusFilter(s)}>
                    <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827', // Gray 900
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280', // Gray 500
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Gray 200
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    height: 40,
    width: 320,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    height: 40,
  },
  filterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF7ED', // Orange 50 (if primary is orange)
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151', // Gray 700
  },

  // Table
  tableContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB', // Gray 50
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHead: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280', // Gray 500
    textTransform: 'none', // Keep it sentence case or normal
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Gray 100
  },
  tableCell: {
    fontSize: 14,
    color: '#374151', // Gray 700
  },
  tableCellView: {
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#4B5563', // Gray 600
  },
  userName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#111827', // Gray 900
  },

  // Pills
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  pillSeller: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  pillBuyer: {
    backgroundColor: '#ECFDF5', // Emerald 50
    borderColor: '#D1FAE5', // Emerald 100
  },
  pillLandlord: {
    backgroundColor: '#F0F9FF', // Sky 50
    borderColor: '#E0F2FE', // Sky 100
  },
  pillRenter: {
    backgroundColor: '#FAF5FF', // Purple 50
    borderColor: '#F3E8FF', // Purple 100
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  pillTextSeller: {
    color: '#374151',
  },
  pillTextBuyer: {
    color: '#059669', // Emerald 600
  },
  pillTextLandlord: {
    color: '#0284C7', // Sky 600
  },
  pillTextRenter: {
    color: '#9333EA', // Purple 600
  },

  // Status Badges
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusActive: { backgroundColor: '#EFF6FF' }, // Blue 50
  statusPending: { backgroundColor: '#FFFBEB' }, // Amber 50
  statusInactive: { backgroundColor: '#FEF2F2' }, // Red 50

  statusText: { fontSize: 12, fontWeight: '500' as const },
  statusTextActive: { color: '#2563EB' }, // Blue 600
  statusTextPending: { color: '#D97706' }, // Amber 600
  statusTextInactive: { color: '#DC2626' }, // Red 600

  emptyState: {
    padding: Spacing.xl * 2,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  modalBody: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  selectContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: Spacing.xl,
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB', // Gray 300
    backgroundColor: Colors.white,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#0F172A', // Slate 900
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.white,
  },

  // Action Menu
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionMenu: {
    position: 'absolute',
    // In a real app we'd calculate this, but for now fixed somewhat centered/right
    top: '40%',
    right: '10%',
    width: 200,
    backgroundColor: Colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionMenuText: {
    fontSize: 14,
    color: '#374151',
  },
  actionMenuDelete: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
  },
  actionMenuDeleteText: {
    fontSize: 14,
    color: '#DC2626',
  },

  // Filter Modal
  filterModalContent: {
    width: 300,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    gap: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    elevation: 5,
  },
  filterSection: { gap: 8 },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  filterChipText: { fontSize: 12, color: '#6B7280' },
  filterChipTextActive: { color: Colors.primary, fontWeight: '600' as const },
});
