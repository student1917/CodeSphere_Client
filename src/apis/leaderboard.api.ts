import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';
import type {
  LeaderboardResponse,
  GlobalLeaderboardResponse,
  GlobalLeaderboardSeason,
} from '@/types/leaderboard.types';

export const leaderboardApi = {
  /**
   * Lấy leaderboard của một problem
   * @param problemId - ID của bài tập
   * @returns Danh sách leaderboard entries
   */
  getLeaderboard: async (problemId: number): Promise<LeaderboardResponse[]> => {
    const response = await apiClient.get<DataResponse<LeaderboardResponse[]>>('/leaderboard', {
      params: { problemId },
    });
    return response.data.data || [];
  },

  /**
   * Lấy rank của user hiện tại trong một problem
   * @param problemId - ID của bài tập
   * @returns Leaderboard entry của user hoặc null nếu chưa submit
   */
  getMyRank: async (problemId: number): Promise<LeaderboardResponse | null> => {
    try {
      const response = await apiClient.get<DataResponse<LeaderboardResponse>>('/leaderboard/my-rank', {
        params: { problemId },
      });
      // Backend trả về 200 OK với data = null và message "Bạn chưa nộp bài nào cho bài tập này"
      // nếu user chưa submit bài
      return response.data.data || null;
    } catch (error: any) {
      // Handle các lỗi khác (401, 400, 500, etc.)
      // Nếu có message "chưa nộp" trong error response, return null
      if (error.response?.data?.message?.includes('chưa nộp')) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Lấy global leaderboard - xếp hạng tất cả users theo tổng số bài đã giải đúng
   * @returns Danh sách global leaderboard entries
   */
  getGlobalLeaderboard: async (
    season: GlobalLeaderboardSeason = 'all',
  ): Promise<GlobalLeaderboardResponse[]> => {
    const response = await apiClient.get<DataResponse<GlobalLeaderboardResponse[]>>('/leaderboard/global', {
      params: { season },
    });
    return response.data.data || [];
  },
};

