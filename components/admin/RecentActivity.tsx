import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Home, Users, FileText, MessageCircle, DollarSign, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import { trpc } from '@/lib/trpc';

export default function RecentActivity() {
  const { data: activities, isLoading, refetch } = trpc.activities.getRecent.useQuery(undefined, {
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'property_listed':
        return <Home size={20} color={Colors.primary} />;
      case 'user_registered':
        return <Users size={20} color={Colors.accent} />;
      case 'property_verified':
        return <FileText size={20} color={Colors.info} />;
      case 'inquiry_received':
        return <MessageCircle size={20} color={Colors.warning} />;
      case 'payment_processed':
        return <DollarSign size={20} color={Colors.success} />;
      default:
        return <Clock size={20} color={Colors.textSecondary} />;
    }
  };

  const getBackground = (type: string) => {
    switch (type) {
      case 'property_listed':
        return Colors.primaryLight + '20';
      case 'user_registered':
        return Colors.accent + '20';
      case 'property_verified':
        return Colors.info + '20';
      case 'inquiry_received':
        return Colors.warning + '20';
      case 'payment_processed':
        return Colors.success + '20';
      default:
        return Colors.backgroundSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock size={20} color={Colors.primary} />
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        <Text style={styles.subtitle}>Latest platform activities</Text>
      </View>

      <View style={styles.list}>
        {activities?.map((activity) => (
          <View key={activity.id} style={styles.item}>
            <View style={[styles.iconContainer, { backgroundColor: getBackground(activity.type) }]}>
              {getIcon(activity.type)}
            </View>
            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.message}>{activity.message}</Text>
                <Text style={styles.time}>
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </View>
              <Text style={styles.user}>{activity.user}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.footer} onPress={() => refetch()}>
        <Text style={styles.footerText}>Load more</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  return `${Math.floor(diffInHours / 24)} days ago`;
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
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 300,
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
  list: {
    gap: Spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  time: {
    fontSize: 12,
    color: '#94A3B8', // slate-400
  },
  user: {
    fontSize: 13,
    color: '#64748B',
  },
  footer: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
