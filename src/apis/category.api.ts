import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';
import type { CategoryResponse } from '@/types/common.types';

export const categoryApi = {
  getAllCategories: async (rootOnly?: boolean): Promise<CategoryResponse[]> => {
    const response = await apiClient.get<DataResponse<CategoryResponse[]>>('/categories', {
      params: rootOnly ? { rootOnly: true } : {},
    });
    return response.data.data!;
  },
};

