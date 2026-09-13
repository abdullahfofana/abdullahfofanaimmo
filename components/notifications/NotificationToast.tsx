import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { MessageSquare, X, ArrowRight, Building2 } from 'lucide-react-native';
import { useNotifications } from '@/providers/NotificationProvider';

interface NotificationToastProps {
  onSelectConversation: (conversationId: string) => void;
  isDark?: boolean;
}

export default function NotificationToast({
  onSelectConversation,
  isDark = true,
}: NotificationToastProps) {
  const { activeToast, dismissToast, markAsRead } = useNotifications();

  if (!activeToast || Platform.OS !== 'web') return null;

  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#334155' : '#CBD5E1';
  const text = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';

  const handleOpen = () => {
    markAsRead(activeToast.id);
    const convId = activeToast.conversationId;
    dismissToast();
    onSelectConversation(convId);
  };

  return (
    <View
      style={[
        styles.toastContainer,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      {/* Icon */}
      <View style={styles.iconCircle}>
        <MessageSquare size={18} color="#FFFFFF" />
      </View>

      {/* Content */}
      <TouchableOpacity
        style={styles.contentArea}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <View style={styles.topRow}>
          <Text style={[styles.senderName, { color: text }]} numberOfLines={1}>
            {activeToast.senderName}
          </Text>
          <View style={styles.badgeNew}>
            <Text style={styles.badgeNewText}>NOUVEAU</Text>
          </View>
        </View>

        {activeToast.propertyTitle && (
          <View style={styles.propertyRow}>
            <Building2 size={11} color="#3B82F6" />
            <Text style={styles.propertyText} numberOfLines={1}>
              {activeToast.propertyTitle}
            </Text>
          </View>
        )}

        <Text style={[styles.messagePreview, { color: textMuted }]} numberOfLines={2}>
          {activeToast.message}
        </Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actionsColumn}>
        <TouchableOpacity
          onPress={dismissToast}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={14} color={textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.replyBtn}
          onPress={handleOpen}
          activeOpacity={0.75}
        >
          <Text style={styles.replyBtnText}>Répondre</Text>
          <ArrowRight size={12} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'fixed' as any,
    top: 20,
    right: 20,
    maxWidth: 380,
    minWidth: 320,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    zIndex: 100000,
    cursor: 'pointer' as any,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  contentArea: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '800',
  },
  badgeNew: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeNewText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  propertyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    maxWidth: 180,
  },
  messagePreview: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  actionsColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  closeBtn: {
    padding: 2,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  replyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
});
