import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/backend/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  initAudioUnlocker,
  playMessageNotificationSound,
  isSoundEnabled,
  setSoundEnabled as saveSoundPref,
} from '@/utils/soundNotification';

const STORAGE_NOTIFICATIONS_KEY = '@immoci_staff_notifications_v1';
const MAX_NOTIFICATIONS = 40;

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  senderUserId?: string;
  senderName: string;
  senderRole?: string;
  conversationId: string;
  messageId: string;
  propertyId?: string;
  propertyTitle?: string;
  type: 'chat_message' | 'system' | 'lead' | 'status_update';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // In-memory set of processed message IDs to guarantee strict deduplication
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const activeConversationIdRef = useRef<string | null>(null);
  const userRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);

  activeConversationIdRef.current = activeConversationId;
  userRef.current = user;

  // 1. Initialize audio unlocker for web browsers
  useEffect(() => {
    const cleanup = initAudioUnlocker();
    isSoundEnabled().then((enabled) => setSoundEnabledState(enabled));
    return cleanup;
  }, []);

  // 2. Load cached notifications on startup
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_NOTIFICATIONS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed: NotificationItem[] = JSON.parse(raw);
            setNotifications(parsed);
            // Prepopulate processed IDs with existing notifications
            parsed.forEach((n) => {
              if (n.messageId) processedMessageIdsRef.current.add(n.messageId);
            });
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // 3. Persist notifications helper
  const persistNotifications = useCallback((items: NotificationItem[]) => {
    setNotifications(items);
    AsyncStorage.setItem(
      STORAGE_NOTIFICATIONS_KEY,
      JSON.stringify(items.slice(0, MAX_NOTIFICATIONS))
    ).catch(() => {});
  }, []);

  // 4. Fetch initial notifications from Supabase
  const loadDatabaseNotifications = useCallback(async () => {
    if (!user?.id || Platform.OS !== 'web') return;

    const isStaff =
      user.role === 'agent' ||
      user.role === 'admin' ||
      user.role === 'super_admin' ||
      user.role === 'support';

    if (!isStaff) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_user_id.eq.${user.id},recipient_user_id.eq.support,recipient_user_id.eq.admin`)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data && data.length > 0) {
        const mapped: NotificationItem[] = data.map((row: any) => ({
          id: row.id,
          recipientUserId: row.recipient_user_id,
          senderUserId: row.sender_user_id,
          senderName: row.sender_name || 'Client',
          conversationId: row.conversation_id,
          messageId: row.message_id,
          propertyId: row.property_id,
          propertyTitle: row.property_title,
          type: row.notification_type || 'chat_message',
          title: row.title,
          message: row.message,
          isRead: row.is_read || false,
          createdAt: row.created_at || new Date().toISOString(),
          readAt: row.read_at,
        }));

        setNotifications((prev) => {
          const merged = [...mapped];
          prev.forEach((existing) => {
            if (!merged.some((m) => m.id === existing.id || (m.messageId && m.messageId === existing.messageId))) {
              merged.push(existing);
            }
          });
          const sorted = merged.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          sorted.forEach((n) => {
            if (n.messageId) processedMessageIdsRef.current.add(n.messageId);
          });
          return sorted;
        });
      }
    } catch {
      // Table might not be populated or offline
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadDatabaseNotifications();
  }, [loadDatabaseNotifications]);

  // 5. Dismiss toast helper
  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setActiveToast(null);
  }, []);

  // 6. Handle incoming message from Supabase Realtime
  const handleIncomingChatMessage = useCallback(
    async (row: any) => {
      if (!row || !row.id) return;

      const messageId: string = row.id;

      // STRICT DEDUPLICATION: check if this message ID has already been processed
      if (processedMessageIdsRef.current.has(messageId)) {
        return;
      }
      processedMessageIdsRef.current.add(messageId);

      const currentStaffUser = userRef.current;
      const senderId: string = row.sender_id || '';
      const senderRole: string = row.sender_role || 'buyer';
      const conversationId: string = row.conversation_id || '';

      // Do not notify the user for their own sent messages
      if (currentStaffUser?.id && senderId === currentStaffUser.id) {
        return;
      }

      // Check if current user is Customer Care / Admin
      const isStaffUser =
        !currentStaffUser ||
        currentStaffUser.role === 'agent' ||
        currentStaffUser.role === 'admin' ||
        currentStaffUser.role === 'super_admin' ||
        currentStaffUser.role === 'support';

      if (!isStaffUser) return;

      // Only notify if message came from customer / buyer
      if (senderRole !== 'buyer' && senderRole !== 'renter') {
        return;
      }

      // ── CONVERSATION ACTIVE SUPPRESSION ──
      // If Customer Care is ALREADY actively viewing this conversation,
      // do NOT display an intrusive toast or increment unread count!
      const isActivelyViewed = activeConversationIdRef.current === conversationId;

      if (isActivelyViewed) {
        // Auto-mark read in database
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', messageId)
          .then(() => {})
          .catch(() => {});
        return;
      }

      // ── EXTRACT CONTEXT & PROPERTY INFO ──
      let propertyTitle: string | undefined;
      let propertyId: string | undefined;
      try {
        const { data: convData } = await supabase
          .from('conversations')
          .select('property_id, property_data')
          .eq('id', conversationId)
          .maybeSingle();

        if (convData) {
          propertyId = convData.property_id;
          propertyTitle = convData.property_data?.title;
        }
      } catch {}

      const senderName = row.sender_name || 'Client ImmoCI';
      const cleanMessage = (row.message || (row.attachments?.length ? '📎 Pièce jointe' : 'Nouveau message')).trim();
      const previewText = cleanMessage.length > 90 ? `${cleanMessage.slice(0, 90)}...` : cleanMessage;

      const newNotif: NotificationItem = {
        id: `notif-${messageId}`,
        recipientUserId: currentStaffUser?.id || 'support',
        senderUserId: senderId,
        senderName,
        senderRole,
        conversationId,
        messageId,
        propertyId,
        propertyTitle,
        type: 'chat_message',
        title: `💬 Message de ${senderName}`,
        message: previewText,
        isRead: false,
        createdAt: row.created_at || new Date().toISOString(),
      };

      // 1. Play professional attention sound (guaranteed once per message)
      playMessageNotificationSound();

      // 2. Add to notification state
      setNotifications((prev) => {
        const next = [newNotif, ...prev.filter((n) => n.messageId !== messageId)].slice(0, MAX_NOTIFICATIONS);
        AsyncStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });

      // 3. Show floating toast notification with 6s auto-dismiss
      dismissToast();
      setActiveToast(newNotif);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToast((curr) => (curr?.id === newNotif.id ? null : curr));
      }, 6500);

      // 4. Persist to Supabase notifications table (resilient fallback if table absent)
      try {
        await supabase.from('notifications').insert({
          id: newNotif.id,
          recipient_user_id: newNotif.recipientUserId,
          sender_user_id: newNotif.senderUserId,
          sender_name: newNotif.senderName,
          conversation_id: newNotif.conversationId,
          message_id: newNotif.messageId,
          property_id: newNotif.propertyId,
          property_title: newNotif.propertyTitle,
          notification_type: newNotif.type,
          title: newNotif.title,
          message: newNotif.message,
          is_read: false,
          created_at: newNotif.createdAt,
        });
      } catch {
        // Handled silently
      }
    },
    [dismissToast]
  );

  // 7. Supabase Realtime Subscription
  useEffect(() => {
    if (Platform.OS !== 'web' || !supabase || typeof supabase.channel !== 'function') {
      return;
    }

    const channelName = `immoci_staff_notifs_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          if (payload.new) {
            handleIncomingChatMessage(payload.new);
          }
        }
      )
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Notifications] ✅ Realtime notifications channel SUBSCRIBED');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [handleIncomingChatMessage]);

  // 7b. Multi-tab Web Sync via BroadcastChannel
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('immoci_chat_sync_channel');
        bc.onmessage = (event) => {
          const data = event.data;
          if (data && data.type === 'NEW_MESSAGE' && data.message) {
            const m = data.message;
            handleIncomingChatMessage({
              id: m.id,
              sender_id: m.senderId,
              sender_name: m.senderName,
              sender_role: m.senderRole,
              conversation_id: m.conversationId,
              message: m.message,
              attachments: m.attachments,
              created_at: m.timestamp,
            });
          }
        };
        return () => {
          try {
            bc.close();
          } catch {}
        };
      } catch {}
    }
  }, [handleIncomingChatMessage]);

  // 8. Actions
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      );
      persistNotifications(next);
      return next;
    });

    supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .then(() => {})
      .catch(() => {});
  }, [persistNotifications]);

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true, readAt: now }));
      persistNotifications(next);
      return next;
    });

    if (user?.id) {
      supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .or(`recipient_user_id.eq.${user.id},recipient_user_id.eq.support,recipient_user_id.eq.admin`)
        .then(() => {})
        .catch(() => {});
    }
  }, [persistNotifications, user?.id]);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== notificationId);
      persistNotifications(next);
      return next;
    });

    supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .then(() => {})
      .catch(() => {});
  }, [persistNotifications]);

  const toggleSound = useCallback(async () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    await saveSoundPref(next);
    if (next) {
      // Play a short test confirmation chime when enabled
      playMessageNotificationSound(true);
    }
  }, [soundEnabled]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    soundEnabled,
    activeToast,
    activeConversationId,
    setActiveConversationId,
    markAsRead,
    markAllAsRead,
    clearNotification,
    toggleSound,
    dismissToast,
    loadDatabaseNotifications,
  };
});
