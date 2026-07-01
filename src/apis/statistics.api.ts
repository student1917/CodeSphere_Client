import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';

export interface MyStatsResponse {
  totalSolved: number;
  solvedEasy: number;
  solvedMedium: number;
  solvedHard: number;
  totalAttempted: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  progressRate: number;
  attemptedEasy: number;
  attemptedMedium: number;
  attemptedHard: number;
}

export interface ProblemStatsResponse {
  problemId: number;
  problemTitle: string;
  problemCode: string;
  level: string;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  totalUsersAttempted: number;
  totalUsersSolved: number;
  solveRate: number;
}

export const statisticsApi = {
  getMyStats: async (): Promise<MyStatsResponse> => {
    const response = await apiClient.get<DataResponse<MyStatsResponse>>('/stats/my-stats');
    return response.data.data!;
  },
  getProblemStats: async (problemId: number): Promise<ProblemStatsResponse> => {
    const response = await apiClient.get<DataResponse<ProblemStatsResponse>>(`/stats/problems/${problemId}`);
    return response.data.data!;
  },
};

