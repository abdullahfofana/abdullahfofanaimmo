import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, Alert, AppState, type AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/backend/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { Property } from '@/types/property';
import type {
  ChatConversation,
  ChatMessage,
  ChatAttachment,
  ConversationParticipant,
  ConversationPropertyContext,
  MessageRole,
  CaseStatus,
  CaseStatusChange,
} from '@/types/chat';

const STORAGE_CONVERSATIONS_KEY = '@immoci_chat_conversations_v4';
const STORAGE_MESSAGES_KEY = '@immoci_chat_messages_v4';

// Helper: sort conversations by newest message first
const sortConversations = (convs: ChatConversation[]) => {
  return [...convs].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
};

// Map database row to ChatConversation type
function mapRowToConversation(row: any): ChatConversation {
  return {
    id: row.id,
    propertyId: row.property_id,
    property: row.property_data || undefined,
    buyer: row.buyer_data || { id: row.buyer_id, name: 'Client', role: 'buyer' },
    agent: row.agent_data || { id: row.agent_id, name: 'Agent', role: 'agent' },
    lastMessage: row.last_message || '',
    lastMessageAt: row.last_message_at || row.updated_at || new Date().toISOString(),
    unreadCountBuyer: row.unread_count_buyer || 0,
    unreadCountAgent: row.unread_count_agent || 0,
    status: row.status || 'active',
    caseStatus: (row.case_status as CaseStatus) || 'Open',
    department: row.department || 'Customer Care',
    statusHistory: row.status_history || [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Map database row to ChatMessage type
function mapRowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name || 'Utilisateur',
    senderAvatar: row.sender_avatar || undefined,
    senderRole: (row.sender_role as MessageRole) || 'buyer',
    message: row.message || '',
    attachments: Array.isArray(row.attachments) && row.attachments.length > 0 ? row.attachments : undefined,
    timestamp: row.created_at || new Date().toISOString(),
    isRead: row.is_read || false,
    status: 'delivered',
  };
}

// Resilient Supabase insert helpers with schema-fallback
async function safeInsertConversation(data: Record<string, any>) {
  try {
    const res = await supabase.from('conversations').insert(data as any);
    if (res.error && res.error.message?.toLowerCase().includes('column')) {
      const fallbackData = { ...data };
      delete fallbackData.case_status;
      delete fallbackData.department;
      delete fallbackData.status_history;
      return await supabase.from('conversations').insert(fallbackData as any);
    }
    return res;
  } catch (err) {
    console.warn('[Chat] Resilient conv insert error:', err);
    return { data: null, error: err };
  }
}

async function safeInsertMessage(data: Record<string, any>) {
  try {
    const res = await supabase.from('messages').insert(data as any);
    if (res.error && res.error.message?.toLowerCase().includes('column')) {
      const fallbackData = { ...data };
      delete fallbackData.attachments;
      return await supabase.from('messages').insert(fallbackData as any);
    }
    return res;
  } catch (err) {
    console.warn('[Chat] Resilient msg insert error:', err);
    return { data: null, error: err };
  }
}

const GUEST_ID_STORAGE_KEY = '@immoci_chat_guest_id';
let cachedGuestId: string = '';

// Preload guest ID from AsyncStorage for native mobile apps
AsyncStorage.getItem(GUEST_ID_STORAGE_KEY).then((stored) => {
  if (stored) cachedGuestId = stored;
}).catch(() => {});

export function getGuestId(): string {
  if (cachedGuestId) return cachedGuestId;

  if (typeof window !== 'undefined' && (window as any).localStorage) {
    try {
      const stored = (window as any).localStorage.getItem(GUEST_ID_STORAGE_KEY);
      if (stored) {
        cachedGuestId = stored;
        return cachedGuestId;
      }
    } catch {}
  }

  cachedGuestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  if (typeof window !== 'undefined' && (window as any).localStorage) {
    try {
      (window as any).localStorage.setItem(GUEST_ID_STORAGE_KEY, cachedGuestId);
    } catch {}
  }
  AsyncStorage.setItem(GUEST_ID_STORAGE_KEY, cachedGuestId).catch(() => {});
  return cachedGuestId;
}

export const [ChatProvider, useChat] = createContextHook(() => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  const broadcastChannelRef = useRef<any>(null);
  const activeConversationRef = useRef<ChatConversation | null>(null);
  const userRef = useRef(user);
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 1. Cross-Tab BroadcastChannel for instantaneous Web synchronization
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('immoci_live_chat_sync');
        broadcastChannelRef.current = bc;

        bc.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          if (data.type === 'NEW_MESSAGE') {
            const { message } = data;
            handleIncomingMessage(message);
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

  const broadcastEvent = (payload: any) => {
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage(payload);
      }
    } catch (e) {
      console.warn('[Chat] Broadcast postMessage error:', e);
    }
  };

  // 2. Fetch conversations from Supabase (with offline AsyncStorage fallback)
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      // First load cached data for instant initial UI response
      const cachedConvs = await AsyncStorage.getItem(STORAGE_CONVERSATIONS_KEY);
      if (cachedConvs) {
        try {
          const parsed = JSON.parse(cachedConvs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConversations(sortConversations(parsed));
          }
        } catch {}
      }

      const currentUser = userRef.current;
      const currentBuyerId = currentUser?.id || getGuestId();

      const isStaff =
        currentUser?.role === 'admin' ||
        currentUser?.role === 'super_admin' ||
        currentUser?.role === 'agent' ||
        currentUser?.role === 'landlord' ||
        currentUser?.role === 'support';

      let query = supabase.from('conversations').select('*');
      if (!isStaff) {
        // Customers query their conversations by buyer ID (auth UID or persistent guest ID)
        query = query.eq('buyer_id', currentBuyerId);
      }

      const { data, error } = await query.order('last_message_at', { ascending: false });

      if (error) {
        console.warn('[Chat] Supabase fetch conversations error:', error.message);
      } else if (data) {
        const liveConvs = data.map(mapRowToConversation);
        const sorted = sortConversations(liveConvs);
        setConversations(sorted);
        AsyncStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(sorted)).catch(() => {});
      }
    } catch (err) {
      console.warn('[Chat] loadConversations exception:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 3. Fetch messages for a conversation from Supabase with strict ordering & deduplication
  const loadMessagesForConversation = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[Chat] Fetch messages error:', error.message);
        return;
      }

      if (data) {
        const rawMsgs = data.map(mapRowToMessage);
        // Deduplicate messages by ID and sequential identical welcome greetings
        const seenIds = new Set<string>();
        const loadedMsgs: ChatMessage[] = [];
        for (const m of rawMsgs) {
          if (seenIds.has(m.id)) continue;
          seenIds.add(m.id);
          const last = loadedMsgs[loadedMsgs.length - 1];
          if (
            last &&
            last.senderRole === m.senderRole &&
            last.message === m.message &&
            m.senderRole === 'support'
          ) {
            continue; // Skip duplicate identical welcome greeting
          }
          loadedMsgs.push(m);
        }

        // Guarantee strict chronological order by server timestamp
        loadedMsgs.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setMessages((prev) => {
          const next = { ...prev, [conversationId]: loadedMsgs };
          AsyncStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      }
    } catch (err) {
      console.warn('[Chat] loadMessagesForConversation exception:', err);
    }
  }, []);

  // When active conversation changes, load its messages
  useEffect(() => {
    if (activeConversation?.id) {
      loadMessagesForConversation(activeConversation.id);
    }
  }, [activeConversation?.id, loadMessagesForConversation]);

  // 4. Handle incoming message from Supabase Realtime or Broadcast
  const handleIncomingMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const currentList = prev[msg.conversationId] || [];
      const existsIndex = currentList.findIndex((m) => m.id === msg.id);

      let nextList: ChatMessage[];
      if (existsIndex >= 0) {
        // Reconcile optimistic message with confirmed server message
        nextList = currentList.map((m, i) => (i === existsIndex ? { ...m, ...msg, status: 'delivered' } : m));
      } else {
        nextList = [...currentList, msg];
      }

      // Guarantee strict chronological order by server timestamp
      nextList.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const nextMap = { ...prev, [msg.conversationId]: nextList };
      AsyncStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(nextMap)).catch(() => {});
      return nextMap;
    });

    setConversations((prev) => {
      const isCurrentActive = activeConversationRef.current?.id === msg.conversationId;
      const isSender = msg.senderId === userRef.current?.id;

      // If active conversation is open on screen, auto mark as read in Supabase
      if (isCurrentActive && !isSender) {
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', msg.id)
          .then(() => {})
          .catch(() => {});
      }

      const idx = prev.findIndex((c) => c.id === msg.conversationId);
      const isBuyerMsg = msg.senderRole === 'buyer';

      if (idx >= 0) {
        const c = prev[idx];
        const updatedConv: ChatConversation = {
          ...c,
          lastMessage: msg.message || (msg.attachments?.length ? '📎 Pièce jointe' : ''),
          lastMessageAt: msg.timestamp,
          unreadCountBuyer: !isBuyerMsg && !isCurrentActive ? c.unreadCountBuyer + 1 : c.unreadCountBuyer,
          unreadCountAgent: isBuyerMsg && !isCurrentActive ? c.unreadCountAgent + 1 : c.unreadCountAgent,
          updatedAt: msg.timestamp,
        };
        const next = prev.map((item, i) => (i === idx ? updatedConv : item));
        const sorted = sortConversations(next);
        AsyncStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(sorted)).catch(() => {});
        return sorted;
      } else {
        // New conversation arrived: fetch from Supabase
        supabase
          .from('conversations')
          .select('*')
          .eq('id', msg.conversationId)
          .maybeSingle()
          .then(({ data }: { data: any }) => {
            if (data) {
              const newConv = mapRowToConversation(data);
              setConversations((curr) => {
                const updated = sortConversations([newConv, ...curr.filter((c) => c.id !== newConv.id)]);
                AsyncStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(updated)).catch(() => {});
                return updated;
              });
            }
          });
        return prev;
      }
    });
  }, []);

  // 5. Supabase Realtime Channels (PostgreSQL Replication Listeners) with Auto-Reconnect & App Lifecycle
  const setupRealtimeChannel = useCallback(async () => {
    if (!supabase || typeof supabase.channel !== 'function') return;

    if (channelRef.current) {
      try {
        await supabase.removeChannel(channelRef.current);
      } catch {}
      channelRef.current = null;
    }

    // Ensure socket isn't in transitional state before reconnecting
    if ((supabase as any).realtime) {
      while (
        (supabase as any).realtime._connectionState === 'disconnecting' ||
        (supabase as any).realtime._connectionState === 'connecting'
      ) {
        await new Promise((r) => setTimeout(r, 60));
      }
      if (typeof (supabase as any).realtime.connect === 'function') {
        (supabase as any).realtime.connect();
      }
    }

    setConnectionStatus('reconnecting');
    const channelId = `immoci_chat_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          const newRow = payload.new;
          if (!newRow) return;
          const msg = mapRowToMessage(newRow);
          handleIncomingMessage(msg);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload: any) => {
          const updatedRow = payload.new;
          if (!updatedRow) return;
          const updatedMsg = mapRowToMessage(updatedRow);

          setMessages((prev) => {
            const list = prev[updatedMsg.conversationId] || [];
            const nextList = list.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
            return { ...prev, [updatedMsg.conversationId]: nextList };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload: any) => {
          const newRow = payload.new;
          if (!newRow) return;
          const conv = mapRowToConversation(newRow);
          setConversations((prev) => {
            if (prev.some((c) => c.id === conv.id)) return prev;
            return sortConversations([conv, ...prev]);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload: any) => {
          const updatedRow = payload.new;
          if (!updatedRow) return;
          const conv = mapRowToConversation(updatedRow);
          setConversations((prev) => {
            const next = prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
            return sortConversations(next);
          });
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Chat] Realtime channel connected successfully');
          setConnectionStatus('connected');
          reconnectAttemptsRef.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('[Chat] Realtime status:', status, err?.message);
          setConnectionStatus('reconnecting');
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            setupRealtimeChannel();
          }, delay);
        }
      });

    channelRef.current = channel;
  }, [handleIncomingMessage]);

  useEffect(() => {
    setupRealtimeChannel();

    // Mobile AppState listener (background -> active foreground recovery)
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[Chat] App became active, resyncing connection and data...');
        setupRealtimeChannel();
        loadConversations();
        if (activeConversationRef.current?.id) {
          loadMessagesForConversation(activeConversationRef.current.id);
        }
      }
    });

    // Web online/offline listeners
    const handleOnline = () => {
      console.log('[Chat] Network online event detected, reconnecting...');
      setupRealtimeChannel();
      loadConversations();
      if (activeConversationRef.current?.id) {
        loadMessagesForConversation(activeConversationRef.current.id);
      }
    };
    const handleOffline = () => {
      setConnectionStatus('disconnected');
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      appStateSubscription?.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {}
      }
    };
  }, [setupRealtimeChannel, loadConversations, loadMessagesForConversation]);

  // 6. Open Chat Modal
  const openChat = (conv: ChatConversation) => {
    setActiveConversation(conv);
    setIsChatOpen(true);
    markAsRead(conv.id);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  // 7. Start or Get Existing Conversation (Duplicate Prevention)
  const startOrGetConversation = async (
    property: Property,
    agentOverride?: any
  ): Promise<ChatConversation | null> => {
    const currentBuyerId = user?.id || getGuestId();
    const currentBuyerName = user?.name || 'Acheteur Intéressé';
    const currentBuyerRole: MessageRole = 'buyer';

    const targetAgentId = agentOverride?.phone || property.agent?.phone || property.agent?.id || 'agent-1';
    const targetAgentName = agentOverride?.name || property.agent?.name || 'Agent Responsable';
    const targetAgentAvatar = agentOverride?.avatar || property.agent?.avatar || '';
    const targetAgentPhone = agentOverride?.phone || property.agent?.phone || '';

    // Check 1: Local state for existing conversation
    const existingLocal = conversations.find(
      (c) => c.propertyId === property.id && c.buyer.id === currentBuyerId
    );
    if (existingLocal) {
      setActiveConversation(existingLocal);
      setIsChatOpen(true);
      markAsRead(existingLocal.id);
      loadMessagesForConversation(existingLocal.id);
      return existingLocal;
    }

    // Check 2: Supabase database for existing conversation
    try {
      const { data: existingDb } = await supabase
        .from('conversations')
        .select('*')
        .eq('property_id', property.id)
        .eq('buyer_id', currentBuyerId)
        .maybeSingle();

      if (existingDb) {
        const conv = mapRowToConversation(existingDb);
        setConversations((prev) => sortConversations([conv, ...prev.filter((c) => c.id !== conv.id)]));
        setActiveConversation(conv);
        setIsChatOpen(true);
        markAsRead(conv.id);
        loadMessagesForConversation(conv.id);
        return conv;
      }
    } catch (e) {
      console.warn('[Chat] Check existing conversation DB error:', e);
    }

    // Create New Conversation in Supabase
    const newConvId = `conv-${property.id}-${Date.now()}`;
    const now = new Date().toISOString();
    const propertyContext: ConversationPropertyContext = {
      id: property.id,
      title: property.title,
      price: property.price,
      currency: property.currency || 'XOF',
      location: `${property.location?.district || ''}, ${property.location?.city || 'Abidjan'}`,
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
        phone: targetAgentPhone,
      },
      lastMessage: initialText,
      lastMessageAt: now,
      unreadCountBuyer: 0,
      unreadCountAgent: 1,
      status: 'active',
      caseStatus: 'Open',
      department: 'Ventes & Locations',
      createdAt: now,
      updatedAt: now,
    };

    const initialGreeting: ChatMessage = {
      id: `msg-init-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId: newConvId,
      senderId: currentBuyerId,
      senderName: currentBuyerName,
      senderRole: currentBuyerRole,
      message: initialText,
      timestamp: now,
      isRead: false,
      status: 'delivered',
    };

    // Optimistic UI updates
    const nextConvs = sortConversations([newConversation, ...conversations]);
    const nextMsgs = { ...messages, [newConvId]: [initialGreeting] };
    setConversations(nextConvs);
    setMessages(nextMsgs);
    setActiveConversation(newConversation);
    setIsChatOpen(true);

    // Insert into Supabase
    try {
      await safeInsertConversation({
        id: newConvId,
        property_id: property.id,
        property_data: propertyContext,
        buyer_id: currentBuyerId,
        buyer_data: newConversation.buyer,
        agent_id: targetAgentId,
        agent_data: newConversation.agent,
        last_message: initialText,
        last_message_at: now,
        unread_count_buyer: 0,
        unread_count_agent: 1,
        status: 'active',
        case_status: 'Open',
        department: 'Ventes & Locations',
        created_at: now,
        updated_at: now,
      });

      await safeInsertMessage({
        id: initialGreeting.id,
        conversation_id: newConvId,
        sender_id: currentBuyerId,
        sender_name: currentBuyerName,
        sender_role: currentBuyerRole,
        message: initialText,
        is_read: false,
        created_at: now,
      });
    } catch (err) {
      console.warn('[Chat] Supabase insert conversation error:', err);
    }

    broadcastEvent({
      type: 'NEW_MESSAGE',
      message: initialGreeting,
    });

    return newConversation;
  };

  // 8. Start Support Conversation
  const startSupportConversation = async (): Promise<ChatConversation | null> => {
    const currentBuyerId = user?.id || getGuestId();
    const currentBuyerName = user?.name || 'Client ImmoCI';
    const currentBuyerPhone = user?.phone || '';

    const existing = conversations.find(
      (c) => c.propertyId === 'support' && c.buyer.id === currentBuyerId
    );
    if (existing) {
      setActiveConversation(existing);
      setIsChatOpen(true);
      loadMessagesForConversation(existing.id);
      return existing;
    }

    try {
      const { data: existingDb } = await supabase
        .from('conversations')
        .select('*')
        .eq('property_id', 'support')
        .eq('buyer_id', currentBuyerId)
        .maybeSingle();

      if (existingDb) {
        const conv = mapRowToConversation(existingDb);
        setConversations((prev) => sortConversations([conv, ...prev.filter((c) => c.id !== conv.id)]));
        setActiveConversation(conv);
        setIsChatOpen(true);
        loadMessagesForConversation(conv.id);
        return conv;
      }
    } catch (e) {
      console.warn('[Chat] Check support DB error:', e);
    }

    const supportConvId = `conv-support-${currentBuyerId}`;
    const now = new Date().toISOString();
    const newSupportConv: ChatConversation = {
      id: supportConvId,
      propertyId: 'support',
      department: 'Customer Care',
      caseStatus: 'Open',
      buyer: {
        id: currentBuyerId,
        name: user?.name || 'Acheteur',
        role: 'buyer',
        phone: user?.phone,
      },
      agent: {
        id: 'support-agent-fatou',
        name: 'Fatou Diallo (Customer Care)',
        role: 'support',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop',
        phone: '+225 07 00 00 00 00',
        department: 'Customer Care',
      },
      lastMessage: 'Bonjour ! Comment pouvons-nous vous aider aujourd’hui dans votre recherche immobilière ?',
      lastMessageAt: now,
      unreadCountBuyer: 0,
      unreadCountAgent: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const welcomeMsgId = `msg-sup-welcome-${currentBuyerId}`;
    const initialSupportMsg: ChatMessage = {
      id: welcomeMsgId,
      conversationId: supportConvId,
      senderId: 'support-agent-fatou',
      senderName: 'Fatou Diallo (Customer Care)',
      senderRole: 'support',
      message: 'Bonjour ! Comment pouvons-nous vous aider aujourd’hui dans votre recherche immobilière ?',
      timestamp: now,
      isRead: true,
      status: 'delivered',
    };

    setConversations((prev) => sortConversations([newSupportConv, ...prev.filter((c) => c.id !== supportConvId)]));
    setMessages((prev) => {
      const existing = prev[supportConvId] || [];
      if (existing.length > 0) return prev;
      return { ...prev, [supportConvId]: [initialSupportMsg] };
    });
    setActiveConversation(newSupportConv);
    setIsChatOpen(true);

    try {
      await safeInsertConversation({
        id: supportConvId,
        property_id: 'support',
        buyer_id: currentBuyerId,
        buyer_data: newSupportConv.buyer,
        agent_id: newSupportConv.agent.id,
        agent_data: newSupportConv.agent,
        last_message: newSupportConv.lastMessage,
        last_message_at: now,
        unread_count_buyer: 0,
        unread_count_agent: 0,
        status: 'active',
        case_status: 'Open',
        department: 'Customer Care',
        created_at: now,
        updated_at: now,
      });

      // Avoid duplicate welcome insert in Supabase
      const { data: existingDbMsgs } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', supportConvId)
        .limit(1);

      if (!existingDbMsgs || existingDbMsgs.length === 0) {
        await safeInsertMessage({
          id: welcomeMsgId,
          conversation_id: supportConvId,
          sender_id: initialSupportMsg.senderId,
          sender_name: initialSupportMsg.senderName,
          sender_role: initialSupportMsg.senderRole,
          message: initialSupportMsg.message,
          attachments: [],
          is_read: true,
          created_at: now,
        });
      }
    } catch (e) {
      console.warn('[Chat] Supabase insert support error:', e);
    }

    return newSupportConv;
  };

  // 9. Send Message (Optimistic UI + Realtime Insertion)
  const sendMessage = async (
    conversationId: string,
    text: string,
    attachments?: ChatAttachment[],
    senderOverride?: {
      role?: MessageRole;
      name?: string;
      id?: string;
      avatar?: string;
    }
  ): Promise<ChatMessage | null> => {
    const hasAttachments = attachments && attachments.length > 0;
    const trimmed = (text || '').trim();
    if (!trimmed && !hasAttachments) return null;

    setIsSending(true);

    const isStaff =
      Boolean(senderOverride?.role && senderOverride.role !== 'buyer') ||
      user?.role === 'agent' ||
      user?.role === 'admin' ||
      user?.role === 'support' ||
      user?.role === 'super_admin' ||
      user?.role === 'landlord';

    const senderRole: MessageRole = senderOverride?.role
      ? senderOverride.role
      : isStaff
      ? (user?.role === 'support' ? 'support' : 'agent')
      : 'buyer';

    const senderId =
      senderOverride?.id ||
      user?.id ||
      (isStaff ? 'support-agent-fatou' : getGuestId());

    const senderName =
      senderOverride?.name ||
      user?.name ||
      (isStaff
        ? (senderRole === 'support' ? 'Fatou Diallo (Customer Care)' : 'Agent ImmoCI')
        : 'Client');

    const now = new Date().toISOString();

    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const displaySummary = trimmed || (hasAttachments ? (attachments![0].type === 'image' ? '📷 Photo' : '📄 Document') : '');

    const newMsg: ChatMessage = {
      id: tempId,
      conversationId,
      senderId,
      senderName,
      senderAvatar: senderOverride?.avatar || user?.avatar,
      senderRole,
      message: trimmed,
      attachments: hasAttachments ? attachments : undefined,
      timestamp: now,
      isRead: false,
      status: 'sending', // Optimistic state
    };

    // 1. Optimistic Local State Update
    setMessages((prev) => {
      const list = prev[conversationId] || [];
      return { ...prev, [conversationId]: [...list, newMsg] };
    });

    setConversations((prev) => {
      const isBuyer = senderRole === 'buyer';
      return sortConversations(
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              lastMessage: displaySummary,
              lastMessageAt: now,
              unreadCountAgent: isBuyer ? c.unreadCountAgent + 1 : c.unreadCountAgent,
              unreadCountBuyer: !isBuyer ? c.unreadCountBuyer + 1 : c.unreadCountBuyer,
              updatedAt: now,
            };
          }
          return c;
        })
      );
    });

    // 2. Insert into Supabase
    try {
      const { error: msgErr } = await safeInsertMessage({
        id: tempId,
        conversation_id: conversationId,
        sender_id: senderId,
        sender_name: senderName,
        sender_avatar: user?.avatar,
        sender_role: senderRole,
        message: trimmed,
        attachments: hasAttachments ? attachments : [],
        is_read: false,
        created_at: now,
      });

      if (msgErr) {
        console.warn('[Chat] Supabase insert message error:', msgErr.message);
        // Mark as failed
        setMessages((prev) => {
          const list = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: list.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)),
          };
        });
        setIsSending(false);
        return null;
      }

      // 3. Update Conversation metadata in Supabase
      const isBuyer = senderRole === 'buyer';
      const targetConv = conversations.find((c) => c.id === conversationId);
      await supabase
        .from('conversations')
        .update({
          last_message: displaySummary,
          last_message_at: now,
          unread_count_agent: isBuyer ? (targetConv?.unreadCountAgent || 0) + 1 : targetConv?.unreadCountAgent || 0,
          unread_count_buyer: !isBuyer ? (targetConv?.unreadCountBuyer || 0) + 1 : targetConv?.unreadCountBuyer || 0,
          updated_at: now,
        })
        .eq('id', conversationId);

      // 4. Update status to delivered
      setMessages((prev) => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.map((m) => (m.id === tempId ? { ...m, status: 'delivered' } : m)),
        };
      });

      broadcastEvent({
        type: 'NEW_MESSAGE',
        message: { ...newMsg, status: 'delivered' },
      });

      setIsSending(false);
      return newMsg;
    } catch (err) {
      console.error('[Chat] Send message exception:', err);
      setMessages((prev) => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)),
        };
      });
      setIsSending(false);
      return null;
    }
  };

  // 10. Mark Conversation as Read
  const markAsRead = async (conversationId: string) => {
    const isStaff =
      user?.role === 'agent' ||
      user?.role === 'admin' ||
      user?.role === 'support' ||
      user?.role === 'super_admin' ||
      user?.role === 'landlord';

    const roleToClear = isStaff ? 'agent' : 'buyer';

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            unreadCountAgent: isStaff ? 0 : c.unreadCountAgent,
            unreadCountBuyer: isStaff ? c.unreadCountBuyer : 0,
          };
        }
        return c;
      })
    );

    setMessages((prev) => {
      const list = prev[conversationId] || [];
      return {
        ...prev,
        [conversationId]: list.map((m) => ({ ...m, isRead: true })),
      };
    });

    try {
      if (user?.id) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id);

        await supabase
          .from('conversations')
          .update(
            isStaff
              ? { unread_count_agent: 0 }
              : { unread_count_buyer: 0 }
          )
          .eq('id', conversationId);
      }
    } catch (e) {
      console.warn('[Chat] markAsRead Supabase error:', e);
    }

    broadcastEvent({
      type: 'MARK_READ',
      conversationId,
      role: roleToClear,
    });
  };

  // 11. Update Case Status (Support tickets)
  const updateCaseStatus = async (
    conversationId: string,
    newStatus: CaseStatus,
    note?: string
  ): Promise<void> => {
    const changerName = user?.name || 'Support ImmoCI';
    const changerRole = user?.role || 'support';
    const timestamp = new Date().toISOString();

    const changeRecord: CaseStatusChange = {
      status: newStatus,
      changedBy: changerName,
      changedByRole: changerRole,
      changedAt: timestamp,
      note: note || `Statut mis à jour : ${newStatus}`,
    };

    setConversations((prev) =>
      sortConversations(
        prev.map((c) => {
          if (c.id === conversationId) {
            const history = c.statusHistory || [];
            return {
              ...c,
              caseStatus: newStatus,
              statusHistory: [...history, changeRecord],
              updatedAt: timestamp,
            };
          }
          return c;
        })
      )
    );

    try {
      const target = conversations.find((c) => c.id === conversationId);
      const nextHistory = [...(target?.statusHistory || []), changeRecord];
      await supabase
        .from('conversations')
        .update({
          case_status: newStatus,
          status_history: nextHistory,
          updated_at: timestamp,
        })
        .eq('id', conversationId);
    } catch (e) {
      console.warn('[Chat] updateCaseStatus error:', e);
    }
  };

  const retryMessage = async (failedMsg: ChatMessage) => {
    await sendMessage(failedMsg.conversationId, failedMsg.message, failedMsg.attachments);
  };

  // Compute total unread counter
  const isStaff =
    user?.role === 'agent' ||
    user?.role === 'admin' ||
    user?.role === 'support' ||
    user?.role === 'super_admin' ||
    user?.role === 'landlord';

  const totalUnreadCount = conversations.reduce((sum, c) => {
    return sum + (isStaff ? c.unreadCountAgent : c.unreadCountBuyer);
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
    openSupportChat: startSupportConversation,
    sendMessage,
    updateCaseStatus,
    markAsRead,
    retryMessage,
    loadConversations,
    loadMessagesForConversation,
    connectionStatus,
  };
});
