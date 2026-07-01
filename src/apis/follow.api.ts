import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';
import type { FollowResponse } from '@/types/follow.types';

export const followApi = {
  followUser: async (userId: number): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>(`/follow/${userId}`);
    return response.data.data!;
  },

  unfollowUser: async (userId: number): Promise<string> => {
    const response = await apiClient.delete<DataResponse<string>>(`/follow/${userId}`);
    return response.data.data!;
  },

  getFollowers: async (userId: number): Promise<FollowResponse[]> => {
    const response = await apiClient.get<DataResponse<FollowResponse[]>>(`/follow/followers/${userId}`);
    return response.data.data!;
  },

  getFollowing: async (userId: number): Promise<FollowResponse[]> => {
    const response = await apiClient.get<DataResponse<FollowResponse[]>>(`/follow/following/${userId}`);
    return response.data.data!;
  },
};

