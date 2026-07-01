import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';
import type { ConversationResponse, CreateConversationRequest, AddMemberRequest, TransferAdminRequest } from '@/types/conversation.types';

export const conversationApi = {
  getConversations: async (): Promise<ConversationResponse[]> => {
    const response = await apiClient.get<DataResponse<ConversationResponse[]>>('/conversations');
    return response.data.data!;
  },

  getConversationById: async (id: number): Promise<ConversationResponse> => {
    const response = await apiClient.get<DataResponse<ConversationResponse>>(`/conversations/${id}`);
    return response.data.data!;
  },

  createConversation: async (request: CreateConversationRequest): Promise<ConversationResponse> => {
    const response = await apiClient.post<DataResponse<ConversationResponse>>('/conversations', request);
    return response.data.data!;
  },

  createOrGetDirectConversation: async (otherUserId: number): Promise<ConversationResponse> => {
    // Tạo DIRECT conversation với 1 participant
    const request: CreateConversationRequest = {
      type: 'DIRECT',
      participantIds: [otherUserId],
    };
    return conversationApi.createConversation(request);
  },

  addMember: async (conversationId: number, request: AddMemberRequest): Promise<ConversationResponse> => {
    const response = await apiClient.post<DataResponse<ConversationResponse>>(
      `/conversations/${conversationId}/members`,
      request
    );
    return response.data.data!;
  },

  removeMember: async (conversationId: number, memberId: number): Promise<void> => {
    await apiClient.delete<DataResponse<string>>(
      `/conversations/${conversationId}/members/${memberId}`
    );
  },

  leaveGroup: async (conversationId: number, newAdminId?: number): Promise<void> => {
    const request = newAdminId ? { newAdminId } : undefined;
    await apiClient.post<DataResponse<string>>(
      `/conversations/${conversationId}/leave`,
      request
    );
  },

  transferAdmin: async (conversationId: number, request: TransferAdminRequest): Promise<ConversationResponse> => {
    const response = await apiClient.post<DataResponse<ConversationResponse>>(
      `/conversations/${conversationId}/transfer-admin`,
      request
    );
    return response.data.data!;
  },
};

