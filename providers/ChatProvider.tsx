import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
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

const STORAGE_CONVERSATIONS_KEY = '@immoci_chat_conversations_v3';
const STORAGE_MESSAGES_KEY = '@immoci_chat_messages_v3';

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
      name: 'Acheteur',
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

// Helper: sort conversations by newest message first
const sortConversations = (convs: ChatConversation[]) => {
  return [...convs].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
};

export const [ChatProvider, useChat] = createContextHook(() => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const broadcastChannelRef = useRef<any>(null);

  // 1. Initialize local cache and Cross-Tab BroadcastChannel
  useEffect(() => {
    loadLocalChatData();

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('immoci_live_chat_sync');
        broadcastChannelRef.current = bc;

        bc.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          if (data.type === 'NEW_MESSAGE') {
            const { message, conversation } = data;
            applyIncomingMessage(message, conversation);
          } else if (data.type === 'CONVERSATION_UPDATED') {
            const { conversation } = data;
            setConversations((prev) => {
              const existingIdx = prev.findIndex((c) => c.id === conversation.id);
              let next: ChatConversation[];
              if (existingIdx >= 0) {
                next = prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c));
              } else {
                next = [conversation, ...prev];
              }
              return sortConversations(next);
            });
          } else if (data.type === 'MARK_READ') {
            const { conversationId, role } = data;
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === conversationId) {
                  return {
                    ...c,
                    unreadCountAgent: role === 'agent' ? 0 : c.unreadCountAgent,
                    unreadCountBuyer: role === 'buyer' ? 0 : c.unreadCountBuyer,
                  };
                }
                return c;
              })
            );
          }
        };

        return () => {
          bc.close();
        };
      } catch (e) {
        console.warn('[Chat] BroadcastChannel setup failed:', e);
      }
    }
  }, []);

  // 2. Storage event listener for Web cross-tab sync fallback
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_CONVERSATIONS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setConversations(sortConversations(parsed));
          }
        } catch {}
      }
      if (e.key === STORAGE_MESSAGES_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setMessages(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 3. Supabase Realtime fallback
  useEffect(() => {
    try {
      // @ts-ignore
      if (!supabase || typeof supabase.channel !== 'function') return;

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

            applyIncomingMessage(receivedMsg);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('[Chat] Supabase realtime channel unavailable:', e);
    }
  }, []);

  const loadLocalChatData = async () => {
    try {
      const [storedConvs, storedMsgs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_CONVERSATIONS_KEY),
        AsyncStorage.getItem(STORAGE_MESSAGES_KEY),
      ]);

      if (storedConvs) {
        const parsedConvs: ChatConversation[] = JSON.parse(storedConvs);
        if (Array.isArray(parsedConvs) && parsedConvs.length > 0) {
          setConversations(sortConversations(parsedConvs));
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
      const sorted = sortConversations(updatedConvs);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(sorted)),
        AsyncStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(updatedMsgs)),
      ]);
    } catch (e) {
      console.error('[Chat] Failed to persist chat data:', e);
    }
  };

  const broadcastEvent = (payload: any) => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage(payload);
      }
    } catch (e) {
      console.warn('[Chat] Broadcast postMessage error:', e);
    }
  };

  const applyIncomingMessage = useCallback(
    (newMsg: ChatMessage, extraConv?: ChatConversation) => {
      setMessages((prevMsgs) => {
        const convId = newMsg.conversationId;
        const currentList = prevMsgs[convId] || [];
        if (currentList.some((m) => m.id === newMsg.id)) {
          return prevMsgs;
        }

        const nextList = [...currentList, newMsg];
        const nextMap = { ...prevMsgs, [convId]: nextList };

        setConversations((prevConvs) => {
          let found = false;
          let nextConvs = prevConvs.map((c) => {
            if (c.id === convId) {
              found = true;
              return {
                ...c,
                lastMessage: newMsg.message,
                lastMessageAt: newMsg.timestamp,
                unreadCountAgent:
                  newMsg.senderRole === 'buyer' ? c.unreadCountAgent + 1 : c.unreadCountAgent,
                unreadCountBuyer:
                  newMsg.senderRole !== 'buyer' ? c.unreadCountBuyer + 1 : c.unreadCountBuyer,
                updatedAt: newMsg.timestamp,
              };
            }
            return c;
          });

          if (!found && extraConv) {
            nextConvs = [extraConv, ...nextConvs];
          } else if (!found) {
            // Generate placeholder conversation card so dashboard sees it immediately
            const fallbackConv: ChatConversation = {
              id: convId,
              propertyId: 'general',
              buyer: { id: newMsg.senderId, name: newMsg.senderName, role: 'buyer' },
              agent: { id: 'agent-general', name: 'Agent ImmoCI', role: 'agent' },
              lastMessage: newMsg.message,
              lastMessageAt: newMsg.timestamp,
              unreadCountBuyer: 0,
              unreadCountAgent: 1,
              status: 'active',
              createdAt: newMsg.timestamp,
              updatedAt: newMsg.timestamp,
            };
            nextConvs = [fallbackConv, ...nextConvs];
          }

          const sorted = sortConversations(nextConvs);
          persistChatData(sorted, nextMap);
          return sorted;
        });

        return nextMap;
      });
    },
    []
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
    const currentBuyerId = user?.id || 'buyer-live';
    const currentBuyerName = user?.name || 'Acheteur Intéressé';
    const currentBuyerRole: MessageRole = 'buyer';

    const targetAgentId = agentOverride?.phone || property.agent?.phone || 'agent-1';
    const targetAgentName = agentOverride?.name || property.agent?.name || 'Agent Responsable';
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

    // Create new conversation
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

    const initialText = `Bonjour, je vous contacte au sujet de votre bien : "${property.title}" (${(property.price / 1000000).toFixed(1)}M FCFA). Est-il toujours disponible ?`;

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
      lastMessage: initialText,
      lastMessageAt: new Date().toISOString(),
      unreadCountBuyer: 0,
      unreadCountAgent: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialGreeting: ChatMessage = {
      id: `msg-init-${Date.now()}`,
      conversationId: newConvId,
      senderId: currentBuyerId,
      senderName: currentBuyerName,
      senderRole: currentBuyerRole,
      message: initialText,
      timestamp: new Date().toISOString(),
      isRead: false,
      status: 'delivered',
    };

    const nextConvs = sortConversations([newConversation, ...conversations]);
    const nextMsgs = { ...messages, [newConvId]: [initialGreeting] };

    setConversations(nextConvs);
    setMessages(nextMsgs);
    setActiveConversation(newConversation);
    setIsChatOpen(true);
    persistChatData(nextConvs, nextMsgs);

    // Broadcast creation to all other tabs (Agent Dashboard)
    broadcastEvent({
      type: 'NEW_MESSAGE',
      message: initialGreeting,
      conversation: newConversation,
    });

    return newConversation;
  };

  const startSupportConversation = async (): Promise<ChatConversation> => {
    // Always reuse existing support conversation (check any support propertyId)
    const existing = conversations.find((c) => c.propertyId === 'support');
    if (existing) {
      setActiveConversation(existing);
      setIsChatOpen(true);
      // Do NOT call markAsRead here so unread badge stays for agent
      return existing;
    }

    const currentBuyerId = user?.id || 'buyer-live';
    const currentBuyerName = user?.name || 'Acheteur';

    // Use stable ID so dashboard and chat modal always sync on the same conversation
    const supportConvId = 'conv-support-1';
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
      lastMessage: 'Bonjour ! Comment pouvons-nous vous aider aujourd\u2019hui dans votre recherche immobili\u00e8re ?',
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
      message: 'Bonjour ! Comment pouvons-nous vous aider aujourd\u2019hui dans votre recherche immobili\u00e8re ?',
      timestamp: new Date().toISOString(),
      isRead: true,
      status: 'delivered',
    };

    const nextConvs = sortConversations([newSupportConv, ...conversations.filter(c => c.propertyId !== 'support')]);
    const nextMsgs = { ...messages, [supportConvId]: [initialSupportMsg] };

    setConversations(nextConvs);
    setMessages(nextMsgs);
    setActiveConversation(newSupportConv);
    setIsChatOpen(true);
    persistChatData(nextConvs, nextMsgs);

    broadcastEvent({
      type: 'NEW_MESSAGE',
      message: initialSupportMsg,
      conversation: newSupportConv,
    });

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
    const senderId = user?.id || (isAgentUser ? 'agent-current' : 'buyer-current');
    const senderName = user?.name || (isAgentUser ? 'Agent ImmoCI' : 'Acheteur');

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
      status: 'delivered',
    };

    // 1. Optimistic local update
    const currentConvMsgs = messages[conversationId] || [];
    const updatedConvMsgs = [...currentConvMsgs, newMsg];
    const updatedMessagesMap = { ...messages, [conversationId]: updatedConvMsgs };

    let activeUpdatedConv: ChatConversation | undefined;

    const updatedConvs = conversations.map((c) => {
      if (c.id === conversationId) {
        activeUpdatedConv = {
          ...c,
          lastMessage: trimmed,
          lastMessageAt: newMsg.timestamp,
          unreadCountAgent: senderRole === 'buyer' ? c.unreadCountAgent + 1 : c.unreadCountAgent,
          unreadCountBuyer: senderRole === 'agent' ? c.unreadCountBuyer + 1 : c.unreadCountBuyer,
          updatedAt: newMsg.timestamp,
        };
        return activeUpdatedConv;
      }
      return c;
    });

    const sortedConvs = sortConversations(updatedConvs);

    setMessages(updatedMessagesMap);
    setConversations(sortedConvs);
    persistChatData(sortedConvs, updatedMessagesMap);

    // 2. Broadcast immediately to all open tabs / windows
    broadcastEvent({
      type: 'NEW_MESSAGE',
      message: newMsg,
      conversation: activeUpdatedConv,
    });

    setIsSending(false);
    return newMsg;
  };

  const markAsRead = async (conversationId: string) => {
    const isAgentUser = user?.role === 'agent' || user?.role === 'admin';
    const roleToClear = isAgentUser ? 'agent' : 'buyer';

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

    broadcastEvent({
      type: 'MARK_READ',
      conversationId,
      role: roleToClear,
    });
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
