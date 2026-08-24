import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/backend/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { Property } from '@/types/property';
import type {
  ChatConversation,
  ChatMessage,
  ConversationParticipant,
  ConversationPropertyContext,
  MessageRole,
} from '@/types/chat';

const STORAGE_CONVERSATIONS_KEY = '@immoci_chat_conversations_v2';
const STORAGE_MESSAGES_KEY = '@immoci_chat_messages_v2';

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-sample-1',
    propertyId: '1',
    property: {
      id: '1',
      title: 'Villa Moderne avec Piscine',
      price: 185000000,
      currency: 'XOF',
      location: 'Cocody Riviera Golf, Abidjan',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop',
      status: 'sale',
    },
    buyer: {
      id: 'buyer-demo-1',
      name: 'Amadou Koné',
      role: 'buyer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
      phone: '+225 07 48 92 11 30',
    },
    agent: {
      id: 'agent-1',
      name: 'Jean-Marc Kouassi',
      role: 'agent',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop',
      phone: '+225 07 08 09 10 11',
    },
    lastMessage: 'Bonjour, la villa est-elle toujours disponible pour une visite ce samedi matin ?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    unreadCountBuyer: 0,
    unreadCountAgent: 1,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'conv-sample-2',
    propertyId: '2',
    property: {
      id: '2',
      title: 'Appartement Haut Standing 4 Pièces',
      price: 1200000,
      currency: 'XOF',
      location: 'Marcory Zone 4, Abidjan',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
      status: 'rent',
    },
    buyer: {
      id: 'buyer-demo-2',
      name: 'Sarah Touré',
      role: 'buyer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop',
      phone: '+225 05 12 34 56 78',
    },
    agent: {
      id: 'agent-2',
      name: 'Awa Diop',
      role: 'agent',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop',
      phone: '+225 01 02 03 04 05',
    },
    lastMessage: 'Parfait, les charges et le gardiennage 24/7 sont bien inclus dans le loyer.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    unreadCountBuyer: 0,
    unreadCountAgent: 0,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'conv-support-1',
    propertyId: 'support',
    property: undefined,
    buyer: {
      id: 'buyer-current',
      name: 'Vous',
      role: 'buyer',
    },
    agent: {
      id: 'support-team',
      name: 'Support Client ImmoCI',
      role: 'support',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop',
      phone: '+225 07 00 00 00 00',
    },
    lastMessage: 'Bonjour ! Comment pouvons-nous vous aider aujourd’hui dans votre recherche immobilière ?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCountBuyer: 1,
    unreadCountAgent: 0,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-sample-1': [
    {
      id: 'msg-101',
      conversationId: 'conv-sample-1',
      senderId: 'agent-1',
      senderName: 'Jean-Marc Kouassi',
      senderRole: 'agent',
      message: 'Bonjour et bienvenue sur l\'annonce de la Villa Moderne à Riviera Golf. Avez-vous des questions particulières ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      isRead: true,
      status: 'delivered',
    },
    {
      id: 'msg-102',
      conversationId: 'conv-sample-1',
      senderId: 'buyer-demo-1',
      senderName: 'Amadou Koné',
      senderRole: 'buyer',
      message: 'Bonjour, la villa est-elle toujours disponible pour une visite ce samedi matin ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      isRead: false,
      status: 'delivered',
    },
  ],
  'conv-sample-2': [
    {
      id: 'msg-201',
      conversationId: 'conv-sample-2',
      senderId: 'buyer-demo-2',
      senderName: 'Sarah Touré',
      senderRole: 'buyer',
      message: 'Bonjour Madame Diop, est-ce que les charges d\'immeuble sont comprises dans le loyer de 1.2M ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      isRead: true,
      status: 'delivered',
    },
    {
      id: 'msg-202',
      conversationId: 'conv-sample-2',
      senderId: 'agent-2',
      senderName: 'Awa Diop',
      senderRole: 'agent',
      message: 'Parfait, les charges et le gardiennage 24/7 sont bien inclus dans le loyer.',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      isRead: true,
      status: 'delivered',
    },
  ],
  'conv-support-1': [
    {
      id: 'msg-sup-1',
      conversationId: 'conv-support-1',
      senderId: 'support-team',
      senderName: 'Support Client ImmoCI',
      senderRole: 'support',
      message: 'Bonjour ! Comment pouvons-nous vous aider aujourd’hui dans votre recherche immobilière ?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      isRead: false,
      status: 'delivered',
    },
  ],
};

export const [ChatProvider, useChat] = createContextHook(() => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Load stored chat conversations & messages on boot
  useEffect(() => {
    loadLocalChatData();
    syncWithSupabase();
  }, []);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    try {
      // @ts-ignore
      if (!supabase || typeof supabase.channel !== 'function') return;

      // Subscribe to inserts on messages table
      const channel = supabase
        .channel('immoci-chat-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload: any) => {
            const newRow = payload.new;
            if (!newRow) return;

            const receivedMsg: ChatMessage = {
              id: newRow.id,
              conversationId: newRow.conversation_id,
              senderId: newRow.sender_id,
              senderName: newRow.sender_name,
              senderAvatar: newRow.sender_avatar,
              senderRole: newRow.sender_role,
              message: newRow.message,
              timestamp: newRow.created_at,
              isRead: newRow.is_read || false,
              status: 'delivered',
            };

            handleIncomingRealtimeMessage(receivedMsg);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('[Chat] Supabase realtime unavailable:', e);
    }
  }, [user]);

  const loadLocalChatData = async () => {
    try {
      const [storedConvs, storedMsgs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_CONVERSATIONS_KEY),
        AsyncStorage.getItem(STORAGE_MESSAGES_KEY),
      ]);

      if (storedConvs) {
        const parsedConvs: ChatConversation[] = JSON.parse(storedConvs);
        if (Array.isArray(parsedConvs) && parsedConvs.length > 0) {
          setConversations(parsedConvs);
        }
      }
      if (storedMsgs) {
        const parsedMsgs: Record<string, ChatMessage[]> = JSON.parse(storedMsgs);
        if (parsedMsgs && typeof parsedMsgs === 'object') {
          setMessages(parsedMsgs);
        }
      }
    } catch (e) {
      console.error('[Chat] Failed to load local chat data:', e);
    }
  };

  const persistChatData = async (
    updatedConvs: ChatConversation[],
    updatedMsgs: Record<string, ChatMessage[]>
  ) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(updatedConvs)),
        AsyncStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(updatedMsgs)),
      ]);
    } catch (e) {
      console.error('[Chat] Failed to persist chat data:', e);
    }
  };

  const syncWithSupabase = async () => {
    try {
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (!convErr && convData && convData.length > 0) {
        const mappedConvs: ChatConversation[] = convData.map((c: any) => ({
          id: c.id,
          propertyId: c.property_id,
          property: c.property_data,
          buyer: c.buyer_data,
          agent: c.agent_data,
          lastMessage: c.last_message || '',
          lastMessageAt: c.last_message_at || c.created_at,
          unreadCountBuyer: c.unread_count_buyer || 0,
          unreadCountAgent: c.unread_count_agent || 0,
          status: c.status || 'active',
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        setConversations(mappedConvs);
      }
    } catch (e) {
      // Offline or schema not ready - local state takes over seamlessly
    }
  };

  const handleIncomingRealtimeMessage = useCallback(
    (newMsg: ChatMessage) => {
      setMessages((prev) => {
        const convId = newMsg.conversationId;
        const currentList = prev[convId] || [];
        if (currentList.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        const nextList = [...currentList, newMsg];
        const nextMap = { ...prev, [convId]: nextList };

        // Also update conversations last message
        setConversations((prevConvs) => {
          const nextConvs = prevConvs.map((c) => {
            if (c.id === convId) {
              const isCurrentActive = activeConversation?.id === convId && isChatOpen;
              return {
                ...c,
                lastMessage: newMsg.message,
                lastMessageAt: newMsg.timestamp,
                unreadCountBuyer:
                  newMsg.senderRole !== 'buyer' && !isCurrentActive
                    ? c.unreadCountBuyer + 1
                    : c.unreadCountBuyer,
                unreadCountAgent:
                  newMsg.senderRole === 'buyer' && !isCurrentActive
                    ? c.unreadCountAgent + 1
                    : c.unreadCountAgent,
              };
            }
            return c;
          });
          persistChatData(nextConvs, nextMap);
          return nextConvs;
        });

        return nextMap;
      });
    },
    [activeConversation, isChatOpen]
  );

  const openChat = (conv: ChatConversation) => {
    setActiveConversation(conv);
    setIsChatOpen(true);
    markAsRead(conv.id);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const startOrGetConversation = async (
    property: Property,
    agentOverride?: any
  ): Promise<ChatConversation> => {
    const currentBuyerId = user?.id || 'guest-buyer';
    const currentBuyerName = user?.name || 'Visiteur';
    const currentBuyerRole: MessageRole = 'buyer';

    const targetAgentId = agentOverride?.phone || property.agent?.phone || 'agent-default';
    const targetAgentName = agentOverride?.name || property.agent?.name || 'Agent Immobilier';
    const targetAgentAvatar = agentOverride?.avatar || property.agent?.avatar || '';

    // Check if an existing conversation exists for this buyer and this property
    const existing = conversations.find(
      (c) => c.propertyId === property.id && c.buyer.id === currentBuyerId
    );

    if (existing) {
      setActiveConversation(existing);
      setIsChatOpen(true);
      markAsRead(existing.id);
      return existing;
    }

    // Create a brand new conversation
    const newConvId = `conv-${property.id}-${Date.now()}`;
    const propertyContext: ConversationPropertyContext = {
      id: property.id,
      title: property.title,
      price: property.price,
      currency: property.currency || 'XOF',
      location: `${property.location.district}, ${property.location.city}`,
      image: property.images?.[0] || '',
      status: property.status,
    };

    const newConversation: ChatConversation = {
      id: newConvId,
      propertyId: property.id,
      property: propertyContext,
      buyer: {
        id: currentBuyerId,
        name: currentBuyerName,
        role: currentBuyerRole,
        avatar: user?.avatar,
        phone: user?.phone,
      },
      agent: {
        id: targetAgentId,
        name: targetAgentName,
        role: 'agent',
        avatar: targetAgentAvatar,
        phone: agentOverride?.phone || property.agent?.phone,
      },
      lastMessage: `Bonjour, je suis intéressé par : ${property.title}`,
      lastMessageAt: new Date().toISOString(),
      unreadCountBuyer: 0,
      unreadCountAgent: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Initial greeting message from buyer
    const initialGreeting: ChatMessage = {
      id: `msg-init-${Date.now()}`,
      conversationId: newConvId,
      senderId: currentBuyerId,
      senderName: currentBuyerName,
      senderRole: currentBuyerRole,
      message: `Bonjour, je vous contacte au sujet de cette annonce : "${property.title}" (${(property.price / 1000000).toFixed(1)}M FCFA). Est-elle toujours disponible ?`,
      timestamp: new Date().toISOString(),
      isRead: false,
      status: 'sent',
    };

    const nextConvs = [newConversation, ...conversations];
    const nextMsgs = { ...messages, [newConvId]: [initialGreeting] };

    setConversations(nextConvs);
    setMessages(nextMsgs);
    setActiveConversation(newConversation);
    setIsChatOpen(true);
    persistChatData(nextConvs, nextMsgs);

    // Save to Supabase in background
    try {
      await supabase.from('conversations').insert({
        id: newConversation.id,
        property_id: newConversation.propertyId,
        property_data: newConversation.property,
        buyer_id: newConversation.buyer.id,
        buyer_data: newConversation.buyer,
        agent_id: newConversation.agent.id,
        agent_data: newConversation.agent,
        last_message: newConversation.lastMessage,
        last_message_at: newConversation.lastMessageAt,
        unread_count_buyer: 0,
        unread_count_agent: 1,
        status: 'active',
      });

      await supabase.from('messages').insert({
        id: initialGreeting.id,
        conversation_id: initialGreeting.conversationId,
        sender_id: initialGreeting.senderId,
        sender_name: initialGreeting.senderName,
        sender_role: initialGreeting.senderRole,
        message: initialGreeting.message,
        is_read: false,
        created_at: initialGreeting.timestamp,
      });
    } catch (e) {
      console.warn('[Chat] Background Supabase insert skipped:', e);
    }

    return newConversation;
  };

  const startSupportConversation = async (): Promise<ChatConversation> => {
    const existing = conversations.find((c) => c.propertyId === 'support');
    if (existing) {
      setActiveConversation(existing);
      setIsChatOpen(true);
      markAsRead(existing.id);
      return existing;
    }

    const currentBuyerId = user?.id || 'guest-user';
    const currentBuyerName = user?.name || 'Visiteur';

    const supportConvId = `conv-support-${Date.now()}`;
    const newSupportConv: ChatConversation = {
      id: supportConvId,
      propertyId: 'support',
      property: undefined,
      buyer: {
        id: currentBuyerId,
        name: currentBuyerName,
        role: 'buyer',
      },
      agent: {
        id: 'support-team',
        name: 'Support Client ImmoCI',
        role: 'support',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop',
        phone: '+225 07 00 00 00 00',
      },
      lastMessage: 'Bonjour ! Comment pouvons-nous vous aider aujourd’hui ?',
      lastMessageAt: new Date().toISOString(),
      unreadCountBuyer: 0,
      unreadCountAgent: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialSupportMsg: ChatMessage = {
      id: `msg-sup-${Date.now()}`,
      conversationId: supportConvId,
      senderId: 'support-team',
      senderName: 'Support Client ImmoCI',
      senderRole: 'support',
      message: 'Bonjour ! Bienvenue sur l\'assistance en direct ImmoCI. Comment pouvons-nous vous accompagner dans votre projet immobilier ?',
      timestamp: new Date().toISOString(),
      isRead: true,
      status: 'delivered',
    };

    const nextConvs = [newSupportConv, ...conversations];
    const nextMsgs = { ...messages, [supportConvId]: [initialSupportMsg] };

    setConversations(nextConvs);
    setMessages(nextMsgs);
    setActiveConversation(newSupportConv);
    setIsChatOpen(true);
    persistChatData(nextConvs, nextMsgs);

    return newSupportConv;
  };

  const sendMessage = async (
    conversationId: string,
    text: string
  ): Promise<ChatMessage | null> => {
    if (!text || !text.trim()) return null;

    const trimmed = text.trim();
    setIsSending(true);

    const isAgentUser = user?.role === 'agent' || user?.role === 'admin';
    const senderRole: MessageRole = isAgentUser ? 'agent' : 'buyer';
    const senderId = user?.id || (isAgentUser ? 'current-agent' : 'current-buyer');
    const senderName = user?.name || (isAgentUser ? 'Agent ImmoCI' : 'Moi');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId,
      senderName,
      senderAvatar: user?.avatar,
      senderRole,
      message: trimmed,
      timestamp: new Date().toISOString(),
      isRead: false,
      status: 'sending',
    };

    // 1. Optimistic local update
    const currentConvMsgs = messages[conversationId] || [];
    const updatedConvMsgs = [...currentConvMsgs, newMsg];
    const updatedMessagesMap = { ...messages, [conversationId]: updatedConvMsgs };

    const updatedConvs = conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: trimmed,
          lastMessageAt: newMsg.timestamp,
          unreadCountAgent: senderRole === 'buyer' ? c.unreadCountAgent + 1 : c.unreadCountAgent,
          unreadCountBuyer: senderRole === 'agent' ? c.unreadCountBuyer + 1 : c.unreadCountBuyer,
          updatedAt: newMsg.timestamp,
        };
      }
      return c;
    });

    setMessages(updatedMessagesMap);
    setConversations(updatedConvs);
    persistChatData(updatedConvs, updatedMessagesMap);

    // 2. Deliver message to Supabase
    try {
      const { error: insertErr } = await supabase.from('messages').insert({
        id: newMsg.id,
        conversation_id: newMsg.conversationId,
        sender_id: newMsg.senderId,
        sender_name: newMsg.senderName,
        sender_avatar: newMsg.senderAvatar,
        sender_role: newMsg.senderRole,
        message: newMsg.message,
        is_read: false,
        created_at: newMsg.timestamp,
      });

      if (!insertErr) {
        // Mark as sent
        const finalMsgs = updatedConvMsgs.map((m) =>
          m.id === newMsg.id ? { ...m, status: 'sent' as const } : m
        );
        const finalMap = { ...messages, [conversationId]: finalMsgs };
        setMessages(finalMap);
        persistChatData(updatedConvs, finalMap);

        // Also update conversation in Supabase
        await supabase
          .from('conversations')
          .update({
            last_message: trimmed,
            last_message_at: newMsg.timestamp,
            updated_at: newMsg.timestamp,
          })
          .eq('id', conversationId);
      } else {
        // Fallback status to delivered locally
        const finalMsgs = updatedConvMsgs.map((m) =>
          m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m
        );
        setMessages({ ...messages, [conversationId]: finalMsgs });
      }
    } catch (e) {
      console.warn('[Chat] Message sent locally:', e);
      const finalMsgs = updatedConvMsgs.map((m) =>
        m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m
      );
      setMessages({ ...messages, [conversationId]: finalMsgs });
    } finally {
      setIsSending(false);
    }

    return newMsg;
  };

  const markAsRead = async (conversationId: string) => {
    const isAgentUser = user?.role === 'agent' || user?.role === 'admin';

    const updatedConvs = conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          unreadCountBuyer: isAgentUser ? c.unreadCountBuyer : 0,
          unreadCountAgent: isAgentUser ? 0 : c.unreadCountAgent,
        };
      }
      return c;
    });

    const currentMsgs = messages[conversationId] || [];
    const updatedMsgs = currentMsgs.map((m) => ({ ...m, isRead: true }));
    const nextMsgMap = { ...messages, [conversationId]: updatedMsgs };

    setConversations(updatedConvs);
    setMessages(nextMsgMap);
    persistChatData(updatedConvs, nextMsgMap);

    try {
      await supabase
        .from('conversations')
        .update({
          ...(isAgentUser ? { unread_count_agent: 0 } : { unread_count_buyer: 0 }),
        })
        .eq('id', conversationId);

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId);
    } catch (e) {
      // offline silent
    }
  };

  const retryMessage = async (failedMsg: ChatMessage) => {
    await sendMessage(failedMsg.conversationId, failedMsg.message);
  };

  // Compute total unread counter
  const isAgentUser = user?.role === 'agent' || user?.role === 'admin';
  const totalUnreadCount = conversations.reduce((sum, c) => {
    return sum + (isAgentUser ? c.unreadCountAgent : c.unreadCountBuyer);
  }, 0);

  return {
    conversations,
    messages,
    activeConversation,
    isChatOpen,
    isLoading,
    isSending,
    totalUnreadCount,
    openChat,
    closeChat,
    setActiveConversation,
    startOrGetConversation,
    startSupportConversation,
    sendMessage,
    markAsRead,
    retryMessage,
  };
});
