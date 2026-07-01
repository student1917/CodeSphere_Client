import apiClient from './apiClient';
import type { DataResponse, PageResponse } from '@/types/common.types';

export interface CreateSubmissionRequest {
  problemId: number;
  languageId: number;
  codeContent: string;
}

export interface CustomTestCase {
  input: string;
  expectedOutput?: string;
}

export interface RunCodeRequest {
  problemId: number;
  languageId: number;
  codeContent: string;
  customTestCases?: CustomTestCase[]; // Array of custom test cases
}

export interface SubmissionResponse {
  id: number;
  problemId: number;
  problemTitle: string;
  languageName: string;
  status: string;
  statusMsg: string;
  isAccepted: boolean;
  score: number;
  totalCorrect: number;
  totalTestcases: number;
  statusRuntime: string;
  statusMemory: string;
  state?: string; // "ACCEPTED", "WRONG_ANSWER", "COMPILE_ERROR", "ERROR", "PENDING"
  createdAt: string;
}

export interface SubmissionDetailResponse {
  id: number;
  problemId: number;
  problemTitle: string;
  languageName: string;
  codeContent: string;
  status?: string; // Deprecated, use state instead
  state?: string; // "PENDING", "ACCEPTED", "WRONG_ANSWER", etc.
  statusCode?: number; // 0 = PENDING, etc.
  statusMsg: string;
  isAccepted: boolean;
  score: number;
  totalCorrect: number;
  totalTestcases: number;
  statusRuntime: string;
  statusMemory: string;
  displayRuntime: string;
  testResults?: TestResult[];
  compileError?: string;
  fullCompileError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemSolutionResponse {
  submissionId: number;
  userId: number;
  username: string;
  rank: number;
  bestScore: number;
  languageName: string;
  languageCode: string;
  statusRuntime: string;
  statusMemory: string;
  submittedAt: string;
  codeContent: string;
}

export interface TestResult {
  testCaseId: number | null;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isPassed: boolean;
  runtime: string;
  memory: string;
  errorMessage?: string;
}

export interface RunCodeResponse {
  success: boolean;
  message: string;
  testResults: TestResult[];
  totalPassed: number;
  totalTests: number;
  compileError?: string;
  fullCompileError?: string;
}

export const submissionApi = {
  // Run code với sample testcases hoặc custom input
  runCode: async (request: RunCodeRequest): Promise<RunCodeResponse> => {
    const response = await apiClient.post<DataResponse<RunCodeResponse>>('/code/run', request);
    return response.data.data!;
  },

  // Submit code - chạy tất cả testcases (bao gồm hidden)
  submitCode: async (request: CreateSubmissionRequest): Promise<SubmissionDetailResponse> => {
    const response = await apiClient.post<DataResponse<SubmissionDetailResponse>>('/submissions', request);
    return response.data.data!;
  },

  // Get submission by ID
  getSubmissionById: async (id: number): Promise<SubmissionDetailResponse> => {
    const response = await apiClient.get<DataResponse<SubmissionDetailResponse>>(`/submissions/${id}`);
    return response.data.data!;
  },

  // Get my submissions
  getMySubmissions: async (params?: {
    problemId?: number;
    search?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<SubmissionResponse>> => {
    const response = await apiClient.get<DataResponse<PageResponse<SubmissionResponse>>>('/submissions/my-submissions', {
      params,
    });
    return response.data.data!;
  },

  getProblemSolutions: async (params: {
    problemId: number;
    search?: string;
    languageCode?: string;
    offset?: number;
    limit?: number;
  }): Promise<ProblemSolutionResponse[]> => {
    const response = await apiClient.get<DataResponse<ProblemSolutionResponse[]>>('/submissions/solutions', {
      params,
    });
    return response.data.data || [];
  },
};

