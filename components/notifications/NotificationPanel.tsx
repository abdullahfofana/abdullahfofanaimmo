import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  X,
  MessageSquare,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useNotifications, NotificationItem } from '@/providers/NotificationProvider';
import { cleanCustomerFacingName } from '@/providers/ChatProvider';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  isDark?: boolean;
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} j`;
  } catch {
    return '';
  }
}

export default function NotificationPanel({
  isOpen,
  onClose,
  onSelectConversation,
  isDark = true,
}: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    clearNotification,
    toggleSound,
  } = useNotifications();

  if (!isOpen) return null;

  const bg = isDark ? '#111827' : '#FFFFFF';
  const border = isDark ? '#1F2937' : '#E2E8F0';
  const text = isDark ? '#F9FAFB' : '#0F172A';
  const textMuted = isDark ? '#9CA3AF' : '#64748B';
  const itemHover = isDark ? '#1F2937' : '#F8FAFC';

  return (
    <>
      {/* Backdrop for closing */}
      {Platform.OS === 'web' && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      <View style={[styles.panel, { backgroundColor: bg, borderColor: border }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: border }]}>
          <View style={styles.headerTitleRow}>
            <View style={styles.titleWithBadge}>
              <Bell size={16} color="#3B82F6" strokeWidth={2.4} />
              <Text style={[styles.title, { color: text }]}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={textMuted} />
            </TouchableOpacity>
          </View>

          {/* Subheader Controls: Mark all read + Sound toggle */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={toggleSound}
              style={[
                styles.controlChip,
                { backgroundColor: soundEnabled ? 'rgba(59, 130, 246, 0.12)' : 'rgba(156, 163, 175, 0.12)' },
              ]}
              activeOpacity={0.7}
            >
              {soundEnabled ? (
                <>
                  <Volume2 size={13} color="#3B82F6" />
                  <Text style={[styles.controlChipText, { color: '#3B82F6' }]}>Son activé</Text>
                </>
              ) : (
                <>
                  <VolumeX size={13} color={textMuted} />
                  <Text style={[styles.controlChipText, { color: textMuted }]}>Son muet</Text>
                </>
              )}
            </TouchableOpacity>

            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={styles.markAllBtn}
                activeOpacity={0.7}
              >
                <CheckCheck size={13} color="#10B981" />
                <Text style={styles.markAllText}>Tout marquer comme lu</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Sparkles size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.emptyTitle, { color: text }]}>Aucune notification</Text>
              <Text style={[styles.emptySubtitle, { color: textMuted }]}>
                Les nouveaux messages des clients s'afficheront ici en temps réel.
              </Text>
            </View>
          ) : (
            notifications.map((item) => {
              const isUnread = !item.isRead;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.item,
                    { borderBottomColor: border },
                    isUnread && {
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.08)'
                        : 'rgba(59, 130, 246, 0.04)',
                    },
                  ]}
                  onPress={() => {
                    markAsRead(item.id);
                    onClose();
                    onSelectConversation(item.conversationId);
                  }}
                  activeOpacity={0.75}
                >
                  {/* Left: Avatar initial or chat icon */}
                  <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
                    <Text style={styles.avatarText}>
                      {item.senderName?.charAt(0)?.toUpperCase() || 'C'}
                    </Text>
                  </View>

                  {/* Center: Info & Message */}
                  <View style={styles.itemBody}>
                    <View style={styles.itemTopRow}>
                      <Text style={[styles.customerName, { color: text }]} numberOfLines={1}>
                        {cleanCustomerFacingName(item.senderName, item.senderRole === 'support')}
                      </Text>
                      <Text style={[styles.timeText, { color: textMuted }]}>
                        {formatRelativeTime(item.createdAt)}
                      </Text>
                    </View>

                    {item.propertyTitle && (
                      <View style={styles.propertyPill}>
                        <Building2 size={11} color="#3B82F6" />
                        <Text style={styles.propertyPillText} numberOfLines={1}>
                          {item.propertyTitle}
                        </Text>
                      </View>
                    )}

                    <Text
                      style={[
                        styles.messagePreview,
                        { color: isUnread ? text : textMuted },
                        isUnread && styles.messagePreviewBold,
                      ]}
                      numberOfLines={2}
                    >
                      {item.message}
                    </Text>
                  </View>

                  {/* Right: Unread Dot or Arrow */}
                  <View style={styles.itemRight}>
                    {isUnread && <View style={styles.unreadDot} />}
                    <ChevronRight size={14} color={textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  panel: {
    position: 'absolute',
    top: 54,
    right: 0,
    width: 360,
    maxWidth: '92vw' as any,
    maxHeight: 520,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    zIndex: 9999,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unreadCountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  unreadCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  controlChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  list: {
    maxHeight: 420,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarUnread: {
    backgroundColor: '#3B82F6',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  itemBody: {
    flex: 1,
    gap: 3,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 180,
  },
  timeText: {
    fontSize: 10.5,
  },
  propertyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    marginBottom: 2,
  },
  propertyPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#3B82F6',
    maxWidth: 200,
  },
  messagePreview: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  messagePreviewBold: {
    fontWeight: '600',
  },
  itemRight: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  emptyState: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
