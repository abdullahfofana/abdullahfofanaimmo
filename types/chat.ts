export type MessageRole = 'buyer' | 'agent' | 'admin' | 'support';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export type CaseStatus = 'Open' | 'In Progress' | 'Hold' | 'Solved' | 'Resolved' | 'Reopen';

export interface CaseStatusChange {
  status: CaseStatus;
  changedBy: string;
  changedByRole: string;
  changedAt: string; // ISO string
  note?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: MessageRole;
  message: string;
  timestamp: string; // ISO string
  isRead: boolean;
  status: MessageStatus;
}

export interface ConversationPropertyContext {
  id: string;
  title: string;
  price: number;
  currency?: string;
  location?: string;
  image?: string;
  status?: 'sale' | 'rent';
}

export interface ConversationParticipant {
  id: string;
  name: string;
  role: MessageRole;
  avatar?: string;
  phone?: string;
  department?: string;
}

export interface ChatConversation {
  id: string;
  propertyId: string; // 'support' for generic customer support
  property?: ConversationPropertyContext;
  buyer: ConversationParticipant;
  agent: ConversationParticipant;
  lastMessage: string;
  lastMessageAt: string; // ISO string
  unreadCountBuyer: number;
  unreadCountAgent: number;
  status: 'active' | 'archived';
  caseStatus?: CaseStatus;
  department?: string; // e.g. 'Customer Care'
  assignedAgent?: ConversationParticipant;
  statusHistory?: CaseStatusChange[];
  createdAt: string;
  updatedAt: string;
}
