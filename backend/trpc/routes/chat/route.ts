import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../../create-context";
import { supabase, USE_SUPABASE } from "@/backend/db";
import type { ChatConversation, ChatMessage, MessageRole } from "@/types/chat";

// ── In-Memory Server Store (persists during server lifetime) ─────────────────
let serverConversations: ChatConversation[] = [
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

let serverMessages: Record<string, ChatMessage[]> = {
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

export const chatRouter = createTRPCRouter({
  // 1. Get all conversations (sorted by newest message)
  getConversations: publicProcedure.query(async () => {
    return [...serverConversations].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }),

  // 2. Get messages for a specific conversation
  getMessages: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      return serverMessages[input.conversationId] || [];
    }),

  // 3. Create or Get conversation
  createOrGetConversation: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        property: z.any().optional(),
        buyer: z.object({
          id: z.string(),
          name: z.string(),
          role: z.enum(['buyer', 'agent', 'admin', 'support']).default('buyer'),
          avatar: z.string().optional(),
          phone: z.string().optional(),
        }),
        agent: z.object({
          id: z.string(),
          name: z.string(),
          role: z.enum(['buyer', 'agent', 'admin', 'support']).default('agent'),
          avatar: z.string().optional(),
          phone: z.string().optional(),
        }),
        initialMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check existing
      const existing = serverConversations.find(
        (c) => c.propertyId === input.propertyId && c.buyer.id === input.buyer.id
      );

      if (existing) {
        return existing;
      }

      const newConvId = `conv-${input.propertyId}-${Date.now()}`;
      const now = new Date().toISOString();

      const newConv: ChatConversation = {
        id: newConvId,
        propertyId: input.propertyId,
        property: input.property,
        buyer: input.buyer,
        agent: input.agent,
        lastMessage: input.initialMessage || 'Nouvelle conversation démarrée',
        lastMessageAt: now,
        unreadCountBuyer: 0,
        unreadCountAgent: 1,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      serverConversations.unshift(newConv);

      if (input.initialMessage) {
        const firstMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          conversationId: newConvId,
          senderId: input.buyer.id,
          senderName: input.buyer.name,
          senderRole: 'buyer',
          message: input.initialMessage,
          timestamp: now,
          isRead: false,
          status: 'delivered',
        };
        serverMessages[newConvId] = [firstMsg];
      } else {
        serverMessages[newConvId] = [];
      }

      return newConv;
    }),

  // 4. Send message
  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        message: z.string().min(1),
        senderId: z.string(),
        senderName: z.string(),
        senderRole: z.enum(['buyer', 'agent', 'admin', 'support']),
        senderAvatar: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const newMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const newMsg: ChatMessage = {
        id: newMsgId,
        conversationId: input.conversationId,
        senderId: input.senderId,
        senderName: input.senderName,
        senderRole: input.senderRole,
        senderAvatar: input.senderAvatar,
        message: input.message.trim(),
        timestamp: now,
        isRead: false,
        status: 'delivered',
      };

      // Append to messages map
      if (!serverMessages[input.conversationId]) {
        serverMessages[input.conversationId] = [];
      }
      serverMessages[input.conversationId].push(newMsg);

      // Update conversation in memory
      let convFound = false;
      serverConversations = serverConversations.map((c) => {
        if (c.id === input.conversationId) {
          convFound = true;
          return {
            ...c,
            lastMessage: newMsg.message,
            lastMessageAt: now,
            unreadCountAgent: input.senderRole === 'buyer' ? c.unreadCountAgent + 1 : c.unreadCountAgent,
            unreadCountBuyer: input.senderRole !== 'buyer' ? c.unreadCountBuyer + 1 : c.unreadCountBuyer,
            updatedAt: now,
          };
        }
        return c;
      });

      // If conversation wasn't found in server list (e.g. created locally), add it
      if (!convFound) {
        const syntheticConv: ChatConversation = {
          id: input.conversationId,
          propertyId: 'general',
          buyer: { id: input.senderId, name: input.senderName, role: 'buyer' },
          agent: { id: 'agent-general', name: 'Agent ImmoCI', role: 'agent' },
          lastMessage: newMsg.message,
          lastMessageAt: now,
          unreadCountBuyer: 0,
          unreadCountAgent: 1,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };
        serverConversations.unshift(syntheticConv);
      }

      return newMsg;
    }),

  // 5. Mark conversation as read
  markAsRead: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        role: z.enum(['buyer', 'agent']).default('agent'),
      })
    )
    .mutation(async ({ input }) => {
      serverConversations = serverConversations.map((c) => {
        if (c.id === input.conversationId) {
          return {
            ...c,
            unreadCountAgent: input.role === 'agent' ? 0 : c.unreadCountAgent,
            unreadCountBuyer: input.role === 'buyer' ? 0 : c.unreadCountBuyer,
          };
        }
        return c;
      });

      if (serverMessages[input.conversationId]) {
        serverMessages[input.conversationId] = serverMessages[input.conversationId].map((m) => ({
          ...m,
          isRead: true,
        }));
      }

      return { success: true };
    }),
});
