import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Bell, X } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import { MatchNotification } from '@/backend/services/search-matching';

export function SearchNotificationListener() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentNotification, setCurrentNotification] = useState<MatchNotification | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100)); // Start off-screen top

  // We use useQuery with refetchInterval for polling
  const { data: notifications } = trpc.search.pollMatches.useQuery(
    { userId: userId || '' },
    { 
      enabled: !!userId,
      refetchInterval: 10000, // Poll every 10 seconds
    }
  );

  const markAsReadMutation = trpc.search.markAsRead.useMutation();

  useEffect(() => {
    const initUserId = async () => {
      const id = await AsyncStorage.getItem('rork_user_id');
      if (id) setUserId(id);
    };
    initUserId();
  }, []);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      // Show the first unread notification
      const nextNotification = notifications[0];
      if (nextNotification.id !== currentNotification?.id) {
          showNotification(nextNotification);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const showNotification = (notification: MatchNotification) => {
    setCurrentNotification(notification);
    Animated.spring(slideAnim, {
      toValue: 0, // Slide down
      useNativeDriver: true,
      tension: 20,
      friction: 6,
    }).start();

    // Auto-hide after 10 seconds if not interacted
    setTimeout(() => {
        if (currentNotification?.id === notification.id) {
            dismissNotification();
        }
    }, 10000);
  };

  const dismissNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -150, // Slide up
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (currentNotification) {
          markAsReadMutation.mutate({ notificationId: currentNotification.id });
      }
      setCurrentNotification(null);
      // If there are more, they will be picked up by next poll or we could force refetch
    });
  };

  const handlePress = () => {
    if (currentNotification) {
      router.push(`/property/${currentNotification.propertyId}`);
      dismissNotification();
    }
  };

  if (!currentNotification) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
            transform: [{ translateY: slideAnim }],
            top: Platform.OS === 'web' ? 20 : 60, // Adjust for status bar
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.content} 
        activeOpacity={0.9} 
        onPress={handlePress}
      >
        <View style={styles.iconContainer}>
            <Bell size={24} color={Colors.white} />
        </View>
        <View style={styles.textContainer}>
            <Text style={styles.title}>Le bien que vous recherchiez est maintenant disponible !</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
                {currentNotification.propertyTitle} - {currentNotification.matchReason}
            </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={dismissNotification}>
            <X size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999, // Ensure it's on top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  closeButton: {
    padding: Spacing.xs,
  },
});
