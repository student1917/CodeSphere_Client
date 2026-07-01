import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';
import type { MessageResponse, SendMessageRequest } from '@/types/conversation.types';

export interface GetMessagesParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export const messageApi = {
  getMessages: async (
    conversationId: number,
    params: GetMessagesParams = {}
  ): Promise<{
    content: MessageResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> => {
    const response = await apiClient.get<DataResponse<{
      content: MessageResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>>(`/conversations/${conversationId}/messages`, { params });
    return response.data.data!;
  },

  sendMessage: async (
    conversationId: number,
    request: SendMessageRequest
  ): Promise<MessageResponse> => {
    const response = await apiClient.post<DataResponse<MessageResponse>>(
      `/conversations/${conversationId}/messages`,
      request
    );
    return response.data.data!;
  },

  deleteMessage: async (conversationId: number, messageId: number): Promise<string> => {
    const response = await apiClient.delete<DataResponse<string>>(
      `/conversations/${conversationId}/messages/${messageId}`
    );
    return response.data.data!;
  },
};

