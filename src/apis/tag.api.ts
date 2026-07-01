import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';
import type { TagResponse } from '@/types/post.types';

export const tagApi = {
  getAllTags: async (type?: 'POST' | 'PROBLEM'): Promise<TagResponse[]> => {
    const params = type ? { type } : undefined;
    const res = await apiClient.get<DataResponse<TagResponse[]>>('/tags', { params });
    return res.data.data ?? [];
  },

  getTag: async (id: number): Promise<TagResponse | null> => {
    const res = await apiClient.get<DataResponse<TagResponse>>(`/tags/${id}`);
    return res.data.data ?? null;
  },
};

export default tagApi;