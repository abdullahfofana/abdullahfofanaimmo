import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNotifications } from '@/providers/NotificationProvider';

interface NotificationBellProps {
  onPress: () => void;
  isOpen?: boolean;
  color?: string;
  backgroundColor?: string;
}

export default function NotificationBell({
  onPress,
  isOpen = false,
  color = '#94A3B8',
  backgroundColor = 'rgba(255, 255, 255, 0.06)',
}: NotificationBellProps) {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      style={[
        styles.bellButton,
        { backgroundColor },
        isOpen && styles.bellButtonActive,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`Notifications (${unreadCount} non lues)`}
    >
      <Bell size={17} color={isOpen ? '#3B82F6' : color} strokeWidth={2.2} />

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bellButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },
});
