export interface ConversationResponse {
  id: number;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatar: string | null;
  createdById: number;
  createdByName: string;
  participants: ConversationParticipantResponse[];
  lastMessage: MessageResponse | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipantResponse {
  userId: number;
  username: string;
  avatar: string | null;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  content: string | null;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  imageUrl: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  type: 'DIRECT' | 'GROUP';
  name?: string;
  avatar?: string;
  participantIds: number[];
}

export interface SendMessageRequest {
  content?: string;
  messageType: 'TEXT' | 'IMAGE';
  imageUrl?: string;
}

export interface AddMemberRequest {
  userIds: number[];
}

export interface TransferAdminRequest {
  newAdminId: number;
}

