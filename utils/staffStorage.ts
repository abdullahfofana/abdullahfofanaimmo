/**
 * ImmoCI — Staff & RBAC Persistence Utility
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StaffAccount, StaffRole, PermissionKey, ROLE_DEFAULT_PERMISSIONS } from '@/types/staffRbac';

const STAFF_STORAGE_KEY = '@immoci_admin_staff_accounts_v1';

export const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff-1',
    name: 'Alice Johnson',
    email: 'alice@immoci.ci',
    phone: '+225 07 01 02 03 04',
    role: 'Super Admin',
    department: 'Platform Administration',
    status: 'Active',
    hireDate: '2023-01-15',
    lastActive: 'À l’instant',
    avatar: 'AJ',
    permissions: ROLE_DEFAULT_PERMISSIONS['Super Admin'],
  },
  {
    id: 'staff-2',
    name: 'Fatou Diallo',
    email: 'fatou.d@immoci.ci',
    phone: '+225 07 00 00 00 00',
    role: 'Customer Care',
    department: 'Customer Support',
    status: 'Active',
    hireDate: '2023-03-20',
    lastActive: '5 min ago',
    avatar: 'FD',
    // Customer Care with standard permissions plus reports view
    permissions: ROLE_DEFAULT_PERMISSIONS['Customer Care'],
  },
  {
    id: 'staff-3',
    name: 'Koffi Kouamé',
    email: 'koffi.k@immoci.ci',
    phone: '+225 05 12 34 56 78',
    role: 'Property Manager',
    department: 'Operations & Logistics',
    status: 'Active',
    hireDate: '2023-02-10',
    lastActive: '12 min ago',
    avatar: 'KK',
    permissions: ROLE_DEFAULT_PERMISSIONS['Property Manager'],
  },
  {
    id: 'staff-4',
    name: 'Jean-Luc Bamba',
    email: 'jeanluc.b@immoci.ci',
    phone: '+225 01 23 45 67 89',
    role: 'Admin',
    department: 'Legal & Compliance',
    status: 'Active',
    hireDate: '2023-05-10',
    lastActive: '1 heure ago',
    avatar: 'JB',
    permissions: ROLE_DEFAULT_PERMISSIONS['Admin'],
  },
  {
    id: 'staff-5',
    name: 'Awa Koné',
    email: 'awa.k@immoci.ci',
    phone: '+225 07 89 01 23 45',
    role: 'Sales',
    department: 'Sales & Commercial',
    status: 'Active',
    hireDate: '2023-06-01',
    lastActive: '2 heures ago',
    avatar: 'AK',
    permissions: ROLE_DEFAULT_PERMISSIONS['Sales'],
  },
];

export async function loadStaffAccounts(): Promise<StaffAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_STAFF_ACCOUNTS));
      return INITIAL_STAFF_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_STAFF_ACCOUNTS;
  } catch (error) {
    console.warn('[StaffStorage] Failed to load staff, fallback to defaults:', error);
    return INITIAL_STAFF_ACCOUNTS;
  }
}

export async function saveStaffAccounts(accounts: StaffAccount[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('[StaffStorage] Failed to save staff accounts:', error);
  }
}

export async function updateStaffMember(updated: StaffAccount): Promise<StaffAccount[]> {
  const current = await loadStaffAccounts();
  const index = current.findIndex((s) => s.id === updated.id);
  let next: StaffAccount[];
  if (index >= 0) {
    next = [...current];
    next[index] = updated;
  } else {
    next = [updated, ...current];
  }
  await saveStaffAccounts(next);
  return next;
}

export async function addStaffMember(
  newMember: Omit<StaffAccount, 'id' | 'permissions'> & { permissions?: PermissionKey[] }
): Promise<StaffAccount> {
  const current = await loadStaffAccounts();
  const id = `staff-${Date.now()}`;
  const permissions = newMember.permissions && newMember.permissions.length > 0
    ? newMember.permissions
    : ROLE_DEFAULT_PERMISSIONS[newMember.role] || [];

  const created: StaffAccount = {
    ...newMember,
    id,
    permissions,
  };

  const next = [created, ...current];
  await saveStaffAccounts(next);
  return created;
}

export function hasPermission(
  staff: StaffAccount | null | undefined,
  permission: PermissionKey
): boolean {
  if (!staff) return false;
  if (staff.role === 'Super Admin') return true;
  return Array.isArray(staff.permissions) && staff.permissions.includes(permission);
}
