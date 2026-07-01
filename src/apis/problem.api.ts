import apiClient from './apiClient';
import type { DataResponse, PageResponse } from '@/types/common.types';
import type { ProblemResponse, ProblemDetailResponse } from '@/types/problem.types';

export interface BookmarkResponse {
  problemId: number;
  isBookmarked: boolean;
  message: string;
}

export const problemApi = {
  getProblems: async (params?: {
    level?: string;
    category?: string;
    tag?: string;
    language?: string;
    bookmarkStatus?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
  }): Promise<PageResponse<ProblemResponse>> => {
    const response = await apiClient.get<DataResponse<PageResponse<ProblemResponse>>>('/problems', {
      params,
    });
    return response.data.data!;
  },

  getProblemById: async (id: number): Promise<ProblemResponse> => {
    const response = await apiClient.get<DataResponse<ProblemResponse>>(`/problems/${id}`);
    return response.data.data!;
  },

  getProblemDetail: async (id: number): Promise<ProblemDetailResponse> => {
    const response = await apiClient.get<DataResponse<ProblemDetailResponse>>(`/problems/${id}`);
    return response.data.data!;
  },

  toggleBookmark: async (problemId: number): Promise<BookmarkResponse> => {
    const response = await apiClient.post<DataResponse<BookmarkResponse>>(`/problems/${problemId}/bookmark`);
    return response.data.data!;
  },

  checkBookmark: async (problemId: number): Promise<BookmarkResponse> => {
    const response = await apiClient.get<DataResponse<BookmarkResponse>>(`/problems/${problemId}/bookmark`);
    return response.data.data!;
  },

  getSampleTestCases: async (problemId: number): Promise<TestCaseResponse[]> => {
    const response = await apiClient.get<DataResponse<TestCaseResponse[]>>(`/problems/${problemId}/sample-testcases`);
    return response.data.data!;
  },
};

export interface TestCaseResponse {
  id: number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  isHidden: boolean;
  weight: number;
}

