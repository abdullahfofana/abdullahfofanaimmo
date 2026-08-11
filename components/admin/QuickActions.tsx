import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building2, Users, FileText, ChevronRight, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import type { AdminSection } from '@/app/admin';

interface QuickActionsProps {
  onNavigate: (section: AdminSection) => void;
}

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TrendingUp size={20} color={Colors.primary} />
          <Text style={styles.title}>Quick Actions</Text>
        </View>
        <Text style={styles.subtitle}>Manage your platform</Text>
      </View>

      <View style={styles.actionsList}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: Colors.primary }]}
          onPress={() => onNavigate('properties')}
        >
          <View style={styles.actionContent}>
            <Building2 size={24} color={Colors.white} />
            <Text style={[styles.actionText, { color: Colors.white }]}>Manage Properties</Text>
          </View>
          <ChevronRight size={20} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onNavigate('users')}
        >
          <View style={styles.actionContent}>
            <Users size={24} color={Colors.text} />
            <Text style={styles.actionText}>Manage Users</Text>
          </View>
          <ChevronRight size={20} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onNavigate('reports')}
        >
          <View style={styles.actionContent}>
            <FileText size={24} color={Colors.text} />
            <Text style={styles.actionText}>View Reports</Text>
          </View>
          <ChevronRight size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0', // slate-200
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A', // slate-900
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B', // slate-500
    marginLeft: 28, // Icon size + gap
  },
  actionsList: {
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
});
