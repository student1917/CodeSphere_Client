import apiClient from './apiClient';
import type { DataResponse, PageResponse } from '@/types/common.types';
import type { UserPublicProfileResponse, UserSearchResponse } from '@/types/user.types';

export const userApi = {
  getPublicProfile: async (userId: number): Promise<UserPublicProfileResponse> => {
    const response = await apiClient.get<DataResponse<UserPublicProfileResponse>>(`/users/${userId}/profile`);
    return response.data.data!;
  },

  searchUsers: async (query: string, page: number = 0, size: number = 20): Promise<PageResponse<UserSearchResponse>> => {
    const response = await apiClient.get<DataResponse<PageResponse<UserSearchResponse>>>(`/users/search`, {
      params: { query, page, size },
    });
    return response.data.data!;
  },
};

