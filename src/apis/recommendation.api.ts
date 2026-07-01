import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';

/**
 * Response type cho recommendation
 */
export interface RecommendationResponse {
  problemId: number;
  predictedRating: number;
  title?: string;
  level?: string;
  explanation?: string; // Explanation từ OpenAI (nếu có)
}

/**
 * API để lấy recommendations cho user
 */
export const recommendationApi = {
  /**
   * Lấy danh sách recommendations cho user hiện tại
   * @param limit Số lượng recommendations muốn lấy (mặc định 10)
   * @param useOpenAI Có dùng OpenAI để refine và thêm explanation không (mặc định true)
   * @returns Danh sách recommendations
   */
  getRecommendations: async (limit: number = 10, useOpenAI: boolean = true): Promise<RecommendationResponse[]> => {
    try {
      const response = await apiClient.get<DataResponse<RecommendationResponse[]>>(
        '/recommendations',
        {
          params: { limit, useOpenAI }
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Lỗi khi lấy recommendations:', error);
      return [];
    }
  },

  /**
   * Kiểm tra recommendation service có đang hoạt động không
   * @returns true nếu service đang hoạt động
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get<DataResponse<boolean>>('/recommendations/health');
      return response.data.data || false;
    } catch (error) {
      console.error('Lỗi khi kiểm tra health:', error);
      return false;
    }
  }
};

