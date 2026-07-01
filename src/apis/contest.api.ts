import apiClient from './apiClient';
import type { DataResponse, PageResponse } from '@/types/common.types';
import type {
  ContestResponse,
  ContestDetailResponse,
  ContestProblemResponse,
  ContestLeaderboardResponse,
  ContestSubmissionResponse,
  ContestRegistrationResponse,
  RegisterContestRequest,
} from '@/types/contest.types';

export const contestApi = {
  getContests: async (
    page = 0,
    size = 20,
    isPublic?: boolean,
    status?: string,
    contestType?: 'PRACTICE' | 'OFFICIAL'
  ): Promise<PageResponse<ContestResponse>> => {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (isPublic !== undefined) params.isPublic = String(isPublic);
    if (status) params.status = status;
    if (contestType) params.contestType = contestType;
    const qp = new URLSearchParams(params).toString();
    const response = await apiClient.get<DataResponse<PageResponse<ContestResponse>>>(`/contests?${qp}`);
    return response.data.data!;
  },

  getContestById: async (id: number): Promise<ContestDetailResponse> => {
    const response = await apiClient.get<DataResponse<ContestDetailResponse>>(`/contests/${id}`);
    return response.data.data!;
  },

  registerContest: async (id: number, request?: RegisterContestRequest): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>(`/contests/${id}/register`, request || {});
    return response.data.data!;
  },

  startContest: async (id: number): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>(`/contests/${id}/start`);
    return response.data.data!;
  },

  finishContest: async (id: number): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>(`/contests/${id}/finish`);
    return response.data.data!;
  },

  getContestProblems: async (id: number): Promise<ContestProblemResponse[]> => {
    const response = await apiClient.get<DataResponse<ContestProblemResponse[]>>(`/contests/${id}/problems`);
    return response.data.data!;
  },

  getContestLeaderboard: async (id: number): Promise<ContestLeaderboardResponse[]> => {
    const response = await apiClient.get<DataResponse<ContestLeaderboardResponse[]>>(`/contests/${id}/leaderboard`);
    return response.data.data!;
  },

  submitToContest: async (id: number, submissionId: number): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>(`/contests/${id}/submit?submissionId=${submissionId}`);
    return response.data.data!;
  },

  getContestSubmissions: async (id: number, problemId?: number): Promise<ContestSubmissionResponse[]> => {
    const params: Record<string, string> = {};
    if (problemId) params.problemId = String(problemId);
    const qp = new URLSearchParams(params).toString();
    const response = await apiClient.get<DataResponse<ContestSubmissionResponse[]>>(`/contests/${id}/submissions${qp ? `?${qp}` : ''}`);
    return response.data.data!;
  },

  getContestRegistrations: async (id: number): Promise<ContestRegistrationResponse[]> => {
    const response = await apiClient.get<DataResponse<ContestRegistrationResponse[]>>(`/contests/${id}/registrations`);
    return response.data.data!;
  },

  verifyAccessCode: async (accessCode: string): Promise<ContestResponse> => {
    const response = await apiClient.post<DataResponse<ContestResponse>>('/contests/verify-access-code', { accessCode });
    return response.data.data!;
  },
};

