import React from 'react';
import AdminDashboardWrapper from './admin';

/**
 * ImmoCI Unified Staff & Admin Dashboard.
 *
 * Implements the unified dashboard architecture where both Staff and Admin users
 * access the same core dashboard foundation, design system, navigation structure,
 * and business modules, governed dynamically by Role-Based Access Control (RBAC)
 * and granular permissions.
 */
export default function UnifiedDashboard() {
  return <AdminDashboardWrapper />;
}
