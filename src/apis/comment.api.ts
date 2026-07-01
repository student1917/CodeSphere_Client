import apiClient from './apiClient';
import type { DataResponse, PageResponse } from '@/types/common.types';
import type { CommentResponse, CreateCommentRequest, UpdateCommentRequest } from '@/types/comment.types';

export const commentApi = {
  // Lấy danh sách comments của một problem
  getComments: async (problemId: number, params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
  }): Promise<PageResponse<CommentResponse>> => {
    const response = await apiClient.get<DataResponse<PageResponse<CommentResponse>>>(`/problems/${problemId}/comments`, {
      params,
    });
    return response.data.data!;
  },

  // Tạo comment mới
  createComment: async (data: CreateCommentRequest): Promise<CommentResponse> => {
    const response = await apiClient.post<DataResponse<CommentResponse>>(`/problems/${data.problemId}/comments`, {
      content: data.content,
      parentCommentId: data.parentId || null,
    });
    return response.data.data!;
  },

  // Cập nhật comment
  updateComment: async (commentId: number, data: UpdateCommentRequest): Promise<CommentResponse> => {
    const response = await apiClient.put<DataResponse<CommentResponse>>(`/comments/${commentId}`, {
      content: data.content,
    });
    return response.data.data!;
  },

  // Xóa comment
  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete<DataResponse<void>>(`/comments/${commentId}`);
  },

  // Lấy replies của một comment
  getReplies: async (commentId: number, params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<CommentResponse>> => {
    const response = await apiClient.get<DataResponse<PageResponse<CommentResponse>>>(`/comments/${commentId}/replies`, {
      params,
    });
    return response.data.data!;
  },

  // ========== POST COMMENTS ==========
  // Lấy danh sách comments của một post
  getPostComments: async (postId: number, params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
  }): Promise<PageResponse<CommentResponse>> => {
    const response = await apiClient.get<DataResponse<PageResponse<CommentResponse>>>(`/posts/${postId}/comments`, {
      params,
    });
    return response.data.data!;
  },

  // Tạo comment mới cho post
  createPostComment: async (postId: number, data: { content: string; parentId?: number }): Promise<CommentResponse> => {
    const response = await apiClient.post<DataResponse<CommentResponse>>(`/posts/${postId}/comments`, {
      content: data.content,
      parentCommentId: data.parentId || null,
    });
    return response.data.data!;
  },
};

