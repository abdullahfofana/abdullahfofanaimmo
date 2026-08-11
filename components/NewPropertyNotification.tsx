import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';

export function NewPropertyNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<{
    ownerName: string;
    id: string;
  } | null>(null);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  
  // Fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data } = trpc.notifications.poll.useQuery(undefined, {
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const handleClose = React.useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setIsVisible(false);
    });
  }, [fadeAnim]);

  useEffect(() => {
    if (data && data.id !== lastSeenId) {
      // Check if the notification is recent (e.g. within last 10 seconds)
      // This prevents showing old notifications when refreshing the page
      const isRecent = Date.now() - data.timestamp < 10000;
      
      if (isRecent) {
        // New notification!
        setCurrentNotification(data);
        setLastSeenId(data.id);
        setIsVisible(true);
        
        // Animate in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web', // Native driver not supported for opacity on web sometimes? actually it is, but safe side.
        }).start();

        // Auto dismiss after 6 seconds
        const timer = setTimeout(() => {
          handleClose();
        }, 6000);

        return () => clearTimeout(timer);
      } else {
        // Even if not recent, we mark it as seen so we don't check it again
        setLastSeenId(data.id);
      }
    }
  }, [data, lastSeenId, fadeAnim, handleClose]);

  if (!isVisible || !currentNotification) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.content}>
          <Text style={styles.text}>
            New property added by: <Text style={styles.bold}>{currentNotification.ownerName}</Text>
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000, // Android z-index
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: '#FFEB3B',
    padding: Spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FDD835',
  },
  text: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  bold: {
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
});
