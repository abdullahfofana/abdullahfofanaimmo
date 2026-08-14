import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building2, Users, FileText, ChevronRight, Zap } from 'lucide-react-native';
import Spacing from '@/constants/spacing';
import type { AdminSection } from '@/app/admin';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface QuickActionsProps {
  onNavigate: (section: AdminSection) => void;
}

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t } = useLanguage();

  const surfaceBg = isDark ? '#161F30' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const btnBg = isDark ? '#1E293B' : '#F8FAFC';

  return (
    <View style={[styles.container, { backgroundColor: surfaceBg, borderColor }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
            <Zap size={18} color="#10B981" />
          </View>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>{t('admin_quick_actions')}</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('admin_quick_actions_subtitle')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsList}>
        {/* Manage Properties Button (Primary Highlight) */}
        <TouchableOpacity
          style={[styles.actionButton, styles.actionPrimary]}
          onPress={() => onNavigate('properties')}
          activeOpacity={0.85}
        >
          <View style={styles.actionContent}>
            <View style={styles.actionIconCirclePrimary}>
              <Building2 size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTextPrimary}>{t('admin_manage_properties')}</Text>
          </View>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Manage Users Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: btnBg, borderColor }]}
          onPress={() => onNavigate('users')}
          activeOpacity={0.85}
        >
          <View style={styles.actionContent}>
            <View style={[styles.actionIconCircle, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
              <Users size={18} color="#6366F1" />
            </View>
            <Text style={[styles.actionText, { color: textPrimary }]}>{t('admin_manage_users')}</Text>
          </View>
          <ChevronRight size={18} color={textSecondary} />
        </TouchableOpacity>

        {/* View Reports Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: btnBg, borderColor }]}
          onPress={() => onNavigate('reports')}
          activeOpacity={0.85}
        >
          <View style={styles.actionContent}>
            <View style={[styles.actionIconCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
              <FileText size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.actionText, { color: textPrimary }]}>{t('admin_view_reports')}</Text>
          </View>
          <ChevronRight size={18} color={textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 1,
  },
  actionsList: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconCirclePrimary: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextPrimary: {
    fontSize: 14.5,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  actionText: {
    fontSize: 14.5,
    fontWeight: '700' as const,
  },
});
