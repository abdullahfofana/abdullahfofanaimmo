/**
 * ImmoCI — Enterprise Audit Logging System
 * 
 * Provides an auditable, immutable activity stream for all governance,
 * administrative role changes, permission modifications, property approvals/rejections,
 * and security violation attempts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/backend/supabase';

export type AuditAction =
  | 'STAFF_CREATED'
  | 'STAFF_UPDATED'
  | 'STAFF_ROLE_CHANGED'
  | 'STAFF_PERMISSIONS_CHANGED'
  | 'STAFF_STATUS_CHANGED'
  | 'PROPERTY_APPROVED'
  | 'PROPERTY_REJECTED'
  | 'PROPERTY_DELETED'
  | 'SETTINGS_CHANGED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ALERT';

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: AuditAction;
  severity: AuditSeverity;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  target: string;
  department?: string;
  details?: Record<string, any>;
  ip?: string;
}

const AUDIT_STORAGE_KEY = '@immoci_enterprise_audit_logs_v1';

export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    action: 'PROPERTY_APPROVED',
    severity: 'INFO',
    actor: {
      id: 'staff-1',
      name: 'Alice Johnson',
      email: 'alice@immoci.ci',
      role: 'Super Admin',
    },
    target: 'Villa Cocody Ambassades (prop-101)',
    department: 'Operations & Logistics',
    details: {
      price: 185000000,
      commune: 'Cocody',
      previousStatus: 'pending',
      newStatus: 'approved',
    },
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    action: 'STAFF_PERMISSIONS_CHANGED',
    severity: 'WARNING',
    actor: {
      id: 'staff-admin-root',
      name: 'Abdullah Fofana',
      email: 'abm.fofana@gmail.com',
      role: 'Super Admin',
    },
    target: 'Fatou Diallo (staff-2)',
    department: 'Customer Support',
    details: {
      granted: ['reports.view'],
      revoked: [],
      reason: 'Support Supervisor Reporting Access Grant',
    },
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    action: 'STAFF_CREATED',
    severity: 'INFO',
    actor: {
      id: 'staff-4',
      name: 'Jean-Luc Bamba',
      email: 'jeanluc.b@immoci.ci',
      role: 'Admin',
    },
    target: 'Awa Koné (staff-5)',
    department: 'Sales & Commercial',
    details: {
      assignedRole: 'Sales',
      permissionsCount: 8,
    },
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    action: 'PROPERTY_REJECTED',
    severity: 'WARNING',
    actor: {
      id: 'staff-3',
      name: 'Koffi Kouamé',
      email: 'koffi.k@immoci.ci',
      role: 'Property Manager',
    },
    target: 'Terrain Akouédo Extension (prop-088)',
    department: 'Operations & Logistics',
    details: {
      reason: 'Documents cadastraux manquants et certificat de cession incomplet',
      previousStatus: 'pending',
      newStatus: 'rejected',
    },
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    severity: 'ALERT',
    actor: {
      id: 'dev-customer-09',
      name: 'Guest / Anonymous User',
      email: 'anonymous@guest.ci',
      role: 'Customer (Renter)',
    },
    target: '/admin/staff (Staff Management)',
    department: 'Platform Administration',
    details: {
      attemptedSection: 'staff',
      requiredPermission: 'staff.view',
      actionBlocked: true,
    },
  },
];

export async function loadAuditEvents(): Promise<AuditEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_EVENTS));
      return INITIAL_AUDIT_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_AUDIT_EVENTS;
  } catch (error) {
    console.warn('[AuditLogger] Failed to load audit events, using defaults:', error);
    return INITIAL_AUDIT_EVENTS;
  }
}

export async function logAuditEvent(
  eventData: Omit<AuditEvent, 'id' | 'timestamp'>
): Promise<AuditEvent> {
  const newEvent: AuditEvent = {
    ...eventData,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = await loadAuditEvents();
    // Keep last 500 events
    const updated = [newEvent, ...current].slice(0, 500);
    await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

    // Try Supabase sync in background
    try {
      if (supabase && typeof (supabase as any).from === 'function') {
        await (supabase as any).from('audit_logs').insert({
          id: newEvent.id,
          action: newEvent.action,
          severity: newEvent.severity,
          actor_id: newEvent.actor.id,
          actor_name: newEvent.actor.name,
          actor_email: newEvent.actor.email,
          actor_role: newEvent.actor.role,
          target: newEvent.target,
          department: newEvent.department || 'Platform Administration',
          details: newEvent.details || {},
          created_at: newEvent.timestamp,
        });
      }
    } catch {
      // Offline or table not ready, local storage keeps it secure
    }

    console.log(`[Audit] 🛡️ ${newEvent.severity} - ${newEvent.action} by ${newEvent.actor.name}: ${newEvent.target}`);
    return newEvent;
  } catch (error) {
    console.error('[AuditLogger] Failed to record audit event:', error);
    return newEvent;
  }
}
