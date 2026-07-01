import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';
import type { PostResponse, PostDetailResponse, CreatePostRequest, VoteRequest, VoteResponse, PostReactionUserResponse, PostReactionSummaryResponse, PostShareUserResponse } from '@/types/post.types';

export interface GetPostsParams {
  authorId?: number;
  tag?: string;
  isResolved?: boolean;
  search?: string;
  followedOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export const postApi = {
  getPosts: async (params: GetPostsParams = {}) => {
    const response = await apiClient.get<DataResponse<{
      content: PostResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>>('/posts', { params });
    return response.data.data!;
  },

  getPostById: async (id: number): Promise<PostDetailResponse> => {
    const response = await apiClient.get<DataResponse<PostDetailResponse>>(`/posts/${id}`);
    return response.data.data!;
  },

  createPost: async (data: CreatePostRequest): Promise<PostDetailResponse> => {
    const response = await apiClient.post<DataResponse<PostDetailResponse>>('/posts', data);
    return response.data.data!;
  },

  updatePost: async (id: number, data: Partial<CreatePostRequest>): Promise<PostDetailResponse> => {
    const response = await apiClient.put<DataResponse<PostDetailResponse>>(`/posts/${id}`, data);
    return response.data.data!;
  },

  deletePost: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}`);
  },

  votePost: async (id: number, voteType: number, reactionType?: string): Promise<VoteResponse> => {
    const response = await apiClient.post<DataResponse<VoteResponse>>(`/posts/${id}/vote`, { vote: voteType, reactionType });
    return response.data.data!;
  },

  reportPost: async (id: number, payload: { reasonCode: string; reasonDetail?: string }): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>(`/posts/${id}/report`, payload);
    return response.data.data!;
  },

  getPostReactions: async (id: number, limit = 20): Promise<PostReactionUserResponse[]> => {
    const response = await apiClient.get<DataResponse<PostReactionUserResponse[]>>(`/posts/${id}/reactions`, {
      params: { limit },
    });
    return response.data.data!;
  },

  getPostReactionSummary: async (id: number): Promise<PostReactionSummaryResponse> => {
    const response = await apiClient.get<DataResponse<PostReactionSummaryResponse>>(`/posts/${id}/reaction-summary`);
    return response.data.data!;
  },

  markPostShared: async (id: number): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>(`/posts/${id}/share`);
    return response.data.data!;
  },

  getPostShares: async (id: number, limit = 20): Promise<PostShareUserResponse[]> => {
    const response = await apiClient.get<DataResponse<PostShareUserResponse[]>>(`/posts/${id}/shares`, {
      params: { limit },
    });
    return response.data.data!;
  },
};

