/**
 * SellerAIAssistant — Floating AI assistant dedicated to sellers/agents.
 * Uses Agent 5 (sellerAssistantAgent) via tRPC.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Animated, Dimensions,
} from 'react-native';
import { Briefcase, X, Send, ChevronDown, TrendingUp, FileText, DollarSign, HelpCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import Spacing from '@/constants/spacing';
import { trpc } from '@/lib/trpc';

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: 'Optimiser mon annonce', query: 'Comment optimiser mon annonce pour avoir plus de visibilité ?' },
  { icon: DollarSign, label: 'Estimer le prix', query: 'Comment estimer le bon prix pour ma propriété à Abidjan ?' },
  { icon: FileText, label: 'Écrire la description', query: 'Aide-moi à écrire une description attrayante pour ma villa.' },
  { icon: HelpCircle, label: 'Comment publier ?', query: 'Quelles sont les étapes pour publier une annonce sur ImmoCI ?' },
];

const { height } = Dimensions.get('window');

export default function SellerAIAssistant() {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const chatMutation = trpc.agents.sellerChat.useMutation();

  const open = () => {
    setIsOpen(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '👋 Bonjour ! Je suis votre assistant vendeur ImmoCI.\n\nJe peux vous aider à optimiser vos annonces, estimer les prix du marché, et répondre à vos questions. Comment puis-je vous aider ?',
      }]);
    }
  };

  const close = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 280, useNativeDriver: true }).start(() => setIsOpen(false));
  };

  const send = async (text: string = input) => {
    if (!text.trim() || chatMutation.isPending) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await chatMutation.mutateAsync({ message: text.trim() });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: res.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
      }]);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={[styles.fab, { bottom: 90 + insets.bottom }]}
        onPress={open}
        activeOpacity={0.85}
        testID="sellerAiFab"
      >
        <Briefcase size={22} color="#fff" />
        <Text style={styles.fabLabel}>Vendeur AI</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom, transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.agentAvatar}>
                <Briefcase size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Assistant Vendeur</Text>
                <Text style={styles.headerSub}>Conseiller IA ImmoCI</Text>
              </View>
            </View>
            <TouchableOpacity onPress={close} style={styles.closeBtn}>
              <X size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
            {messages.map(msg => (
              <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.botText]}>
                  {msg.content}
                </Text>
              </View>
            ))}
            {chatMutation.isPending && (
              <View style={[styles.bubble, styles.botBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={[styles.bubbleText, styles.botText, { marginLeft: 8 }]}>Analyse en cours...</Text>
              </View>
            )}
          </ScrollView>

          {/* Quick Actions */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
            {QUICK_ACTIONS.map((qa, i) => (
              <TouchableOpacity key={i} style={styles.quickChip} onPress={() => send(qa.query)}>
                <qa.icon size={12} color={Colors.primary} />
                <Text style={styles.quickChipText}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Posez votre question..."
              placeholderTextColor={Colors.textLight}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || chatMutation.isPending) && styles.sendDisabled]}
              onPress={() => send()}
              disabled={!input.trim() || chatMutation.isPending}
            >
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6, zIndex: 999,
  },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '82%', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 12,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  closeBtn: { padding: 4 },
  messages: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  messagesContent: { padding: Spacing.lg, gap: 12, paddingBottom: Spacing.xl },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  botBubble: {
    alignSelf: 'flex-start', backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border,
  },
  loadingBubble: { flexDirection: 'row', alignItems: 'center' },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText: { color: '#fff' },
  botText: { color: Colors.text },
  quickRow: { maxHeight: 48, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  quickContent: { paddingHorizontal: Spacing.lg, paddingVertical: 10, gap: 8, alignItems: 'center' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    backgroundColor: `${Colors.primary}14`,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  quickChipText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.text,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
