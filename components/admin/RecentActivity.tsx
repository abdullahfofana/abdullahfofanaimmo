import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, Users, FileText, MessageCircle, DollarSign, Clock, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'payment_processed',
    title: 'Paiement reçu',
    description: 'Abonnement Agence Platinum — 150 000 FCFA',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'property_listed',
    title: 'Nouvelle propriété',
    description: 'Villa Triplex 6 Pièces — Cocody Ambassades',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'user_registered',
    title: 'Nouvel utilisateur vérifié',
    description: 'Kouassi Marc (Agent Immobilier Agréé)',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'property_verified',
    title: 'Document Validé',
    description: 'Titre Foncier (ACD) #CI-2024-8842 approuvé',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'inquiry_received',
    title: 'Demande de visite',
    description: 'Appartement Standing 4P — Marcory Zone 4',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
];

export default function RecentActivity() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const { t, language } = useLanguage();

  const activities = DEFAULT_ACTIVITIES;

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
        {activities.map((activity) => (
          <View key={activity.id} style={[styles.item, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' }]}>
            <View style={[styles.iconContainer, { backgroundColor: getBackground(activity.type) }]}>
              {getIcon(activity.type)}
            </View>
            <View style={styles.content}>
              <Text style={[styles.itemTitle, { color: textPrimary }]}>{activity.title}</Text>
              <Text style={[styles.description, { color: textSecondary }]}>{activity.description}</Text>
            </View>
            <Text style={[styles.time, { color: textSecondary }]}>{formatTimeAgo(activity.timestamp)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
});
