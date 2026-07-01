import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';

export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  content: string;
  relatedUserId: number | null;
  relatedUserName: string | null;
  relatedUserAvatar: string | null;
  relatedPostId: number | null;
  relatedCommentId: number | null;
  relatedConversationId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const notificationApi = {
  getNotifications: async (params: {
    type?: string;
    isRead?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
  } = {}): Promise<NotificationPage> => {
    const response = await apiClient.get<DataResponse<NotificationPage>>('/notifications', { params });
    return response.data.data!;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<DataResponse<number>>('/notifications/unread-count');
    return response.data.data!;
  },

  markAsRead: async (id: number): Promise<NotificationResponse> => {
    const response = await apiClient.put<DataResponse<NotificationResponse>>(`/notifications/${id}/read`);
    return response.data.data!;
  },

  markAllAsRead: async (): Promise<string> => {
    const response = await apiClient.put<DataResponse<string>>('/notifications/read-all');
    return response.data.data!;
  },

  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};

