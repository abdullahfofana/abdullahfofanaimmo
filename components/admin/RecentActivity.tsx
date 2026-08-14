import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Home, Users, FileText, MessageCircle, DollarSign, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import { trpc } from '@/lib/trpc';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export default function RecentActivity() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t, language } = useLanguage();

  const { data: activities, isLoading, refetch } = trpc.activities.getRecent.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'property_listed':
        return <Home size={18} color="#10B981" />;
      case 'user_registered':
        return <Users size={18} color="#6366F1" />;
      case 'property_verified':
        return <FileText size={18} color="#3B82F6" />;
      case 'inquiry_received':
        return <MessageCircle size={18} color="#F59E0B" />;
      case 'payment_processed':
        return <DollarSign size={18} color="#10B981" />;
      default:
        return <Clock size={18} color="#94A3B8" />;
    }
  };

  const getBackground = (type: string) => {
    if (isDark) {
      switch (type) {
        case 'property_listed':
          return 'rgba(16, 185, 129, 0.15)';
        case 'user_registered':
          return 'rgba(99, 102, 241, 0.15)';
        case 'property_verified':
          return 'rgba(59, 130, 246, 0.15)';
        case 'inquiry_received':
          return 'rgba(245, 158, 11, 0.15)';
        case 'payment_processed':
          return 'rgba(16, 185, 129, 0.15)';
        default:
          return 'rgba(255, 255, 255, 0.05)';
      }
    }
    switch (type) {
      case 'property_listed':
        return '#ECFDF5';
      case 'user_registered':
        return '#EEF2FF';
      case 'property_verified':
        return '#EFF6FF';
      case 'inquiry_received':
        return '#FEF3C7';
      case 'payment_processed':
        return '#DCFCE7';
      default:
        return '#F1F5F9';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t('admin_just_now');
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('admin_min_ago')}`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${t('admin_hours_ago')}`;
    return `${Math.floor(diffInHours / 24)} ${t('admin_days_ago')}`;
  };

  const surfaceBg = isDark ? '#161F30' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: surfaceBg, borderColor }]}>
        <ActivityIndicator size="small" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: surfaceBg, borderColor }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
            <Clock size={18} color="#10B981" />
          </View>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>{t('admin_recent_activity')}</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('admin_recent_activity_subtitle')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.list}>
        {(!activities || activities.length === 0) ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: textSecondary }}>{language === 'fr' ? 'Aucune activité récente' : 'No recent activity'}</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <View key={activity.id} style={[styles.item, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' }]}>
              <View style={[styles.iconContainer, { backgroundColor: getBackground(activity.type) }]}>
                {getIcon(activity.type)}
              </View>
              <View style={styles.content}>
                <View style={styles.row}>
                  <Text style={[styles.message, { color: textPrimary }]}>{activity.message}</Text>
                  <Text style={[styles.time, { color: textSecondary }]}>
                    {formatTimeAgo(activity.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.user, { color: textSecondary }]}>{activity.user}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[styles.footer, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}
        onPress={() => refetch()}
        activeOpacity={0.8}
      >
        <Text style={styles.footerText}>{t('admin_load_more')}</Text>
      </TouchableOpacity>
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
  list: {
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 13.5,
    fontWeight: '700' as const,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 11.5,
    fontWeight: '500' as const,
  },
  user: {
    fontSize: 12,
  },
  footer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 13.5,
    color: '#10B981',
    fontWeight: '700' as const,
  },
});
