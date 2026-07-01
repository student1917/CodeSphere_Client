// ...existing code...
import apiClient from './apiClient';
import type { DataResponse, PageResponse } from '@/types/common.types';
import type { LanguageResponse } from '@/types/language.types';
import type { UserManagementResponse, DashboardStatsResponse, AuditLogItem } from '@/types/admin.types';
import type { ContestResponse, ContestDetailResponse, CreateContestRequest, ContestProblemRequest } from '@/types/contest.types';

export interface AdminPostItem {
  id: number;
  title: string;
  content: string;
  isBlocked: boolean;
  isDeleted?: boolean;
  isResolved: boolean;
  reportCount?: number;
  lastReportedAt?: string;
  moderationReasonCode?: string;
  moderationReasonDetail?: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id?: number;
    username?: string;
    avatar?: string | null;
  };
}

export interface PostReportResponse {
  id: number;
  reporterId?: number;
  reporterUsername?: string;
  reporterAvatar?: string | null;
  reasonCode: string;
  reasonDetail?: string;
  createdAt: string;
}

export interface ModerationReasonTemplate {
  code: string;
  label: string;
  description: string;
}

export interface ModeratePostPayload {
  reasonCode: string;
  reasonDetail: string;
}

export const adminApi = {
  // Languages
  createLanguage: async (payload: { code: string; name: string; version?: string }) => {
    const res = await apiClient.post<DataResponse<LanguageResponse>>('/admin/languages', payload);
    return res.data.data!;
  },
  updateLanguage: async (id: number, payload: { name?: string; version?: string }) => {
    const res = await apiClient.put<DataResponse<LanguageResponse>>(`/admin/languages/${id}`, payload);
    return res.data.data!;
  },
  deleteLanguage: async (id: number) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/languages/${id}`);
    return res.data.data!;
  },

  // Categories (admin)
  createCategory: async (payload: { name: string }) => {
    const res = await apiClient.post<DataResponse<CategoryResponse>>('/admin/categories', payload);
    return res.data.data!;
  },
  updateCategory: async (id: number, payload: { name?: string }) => {
    const res = await apiClient.put<DataResponse<CategoryResponse>>(`/admin/categories/${id}`, payload);
    return res.data.data!;
  },
  deleteCategory: async (id: number) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/categories/${id}`);
    return res.data.data!;
  },
  getProblems: async (page = 0, size = 20, params: Record<string, any> = {}) => {
    const queryParams: Record<string, string> = { page: String(page), size: String(size) };
    if (params.search) queryParams.search = params.search;
    if (params.isPublic !== undefined) queryParams.isPublic = String(params.isPublic);
    const qp = new URLSearchParams(queryParams).toString();
    const res = await apiClient.get<DataResponse<PageResponse<ProblemResponse>>>(`/admin/problems?${qp}`);
    return res.data.data!;
  },
  
  getProblem: async (id: number) => {
    const res = await apiClient.get<DataResponse<ProblemDetailResponse>>(`/admin/problems/${id}`);
    return res.data.data!;
  },

  createProblem: async (payload: any) => {
    const res = await apiClient.post<DataResponse<ProblemDetailResponse>>('/admin/problems', payload);
    return res.data.data!;
  },

  updateProblem: async (id: number, payload: any) => {
    const res = await apiClient.put<DataResponse<ProblemDetailResponse>>(`/admin/problems/${id}`, payload);
    return res.data.data!;
  },

  deleteProblem: async (id: number) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/problems/${id}`);
    return res.data.data!;
  },
  // Tags (admin)

  createTag: async (payload: { name: string; slug: string }) => {
    const res = await apiClient.post<DataResponse<TagResponse>>('/admin/tags', payload);
    return res.data.data!;
  },
  updateTag: async (id: number, payload: { name?: string; slug?: string }) => {
    const res = await apiClient.put<DataResponse<TagResponse>>(`/admin/tags/${id}`, payload);
    return res.data.data!;
  },
  deleteTag: async (id: number) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/tags/${id}`);
    return res.data.data!;
  },
  // Testcases (admin)
  getTestCasesByProblem: async (problemId: number) => {
    const res = await apiClient.get<DataResponse<TestCaseResponse[]>>(`/problems/${problemId}/testcases`);
    return res.data.data!;
  },

  createTestCase: async (payload: { problemId: number; input: string; expectedOutput: string; isSample?: boolean; isHidden?: boolean; weight?: number }) => {
    const res = await apiClient.post<DataResponse<TestCaseResponse>>('/admin/testcases', payload);
    return res.data.data!;
  },

  updateTestCase: async (id: number, payload: { input?: string; expectedOutput?: string; isSample?: boolean; isHidden?: boolean; weight?: number }) => {
    const res = await apiClient.put<DataResponse<TestCaseResponse>>(`/admin/testcases/${id}`, payload);
    return res.data.data!;
  },

  deleteTestCase: async (id: number) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/testcases/${id}`);
    return res.data.data!;
  },

  // Users (admin)
  getUsers: async (page = 0, size = 20, search?: string, role?: string, status?: string) => {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (search) params.search = search;
    if (role) params.role = role;
    if (status) params.status = status;
    const qp = new URLSearchParams(params).toString();
    const res = await apiClient.get<DataResponse<PageResponse<UserManagementResponse>>>(`/admin/users?${qp}`);
    return res.data.data!;
  },

  getUserById: async (id: number) => {
    const res = await apiClient.get<DataResponse<UserManagementResponse>>(`/admin/users/${id}`);
    return res.data.data!;
  },

  updateUserStatus: async (id: number, status: string) => {
    const res = await apiClient.put<DataResponse<UserManagementResponse>>(`/admin/users/${id}/status?status=${status}`);
    return res.data.data!;
  },

  blockUser: async (id: number) => {
    const res = await apiClient.put<DataResponse<UserManagementResponse>>(`/admin/users/${id}/block`);
    return res.data.data!;
  },

  unblockUser: async (id: number) => {
    const res = await apiClient.put<DataResponse<UserManagementResponse>>(`/admin/users/${id}/unblock`);
    return res.data.data!;
  },

  changeUserRole: async (id: number, role: string) => {
    const res = await apiClient.put<DataResponse<UserManagementResponse>>(`/admin/users/${id}/role?role=${role}`);
    return res.data.data!;
  },

  deleteUser: async (id: number) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/users/${id}`);
    return res.data.data!;
  },

  // Statistics (admin)
  getDashboardStats: async () => {
    const res = await apiClient.get<DataResponse<DashboardStatsResponse>>('/admin/statistics/dashboard');
    return res.data.data!;
  },

  // Audit logs (admin)
  getAuditLogs: async (
    page = 0,
    size = 20,
    params: {
      action?: string;
      objectType?: string;
      actorId?: number;
      objectId?: number;
      fromTime?: string;
      toTime?: string;
      q?: string;
    } = {}
  ) => {
    const query: Record<string, string> = {
      page: String(page),
      size: String(size),
    };

    if (params.action) query.action = params.action;
    if (params.objectType) query.objectType = params.objectType;
    if (typeof params.actorId === 'number') query.actorId = String(params.actorId);
    if (typeof params.objectId === 'number') query.objectId = String(params.objectId);
    if (params.fromTime) query.fromTime = params.fromTime;
    if (params.toTime) query.toTime = params.toTime;
    if (params.q && params.q.trim()) query.q = params.q.trim();

    const qp = new URLSearchParams(query).toString();
    const res = await apiClient.get<DataResponse<PageResponse<AuditLogItem>>>(`/admin/audit-logs?${qp}`);
    return res.data.data!;
  },

  // Contests (admin)
  getContests: async (page = 0, size = 20, search?: string, type?: string) => {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (search) params.search = search;
    if (type) params.type = type;
    const qp = new URLSearchParams(params).toString();
    const res = await apiClient.get<DataResponse<PageResponse<ContestResponse>>>(`/admin/contests?${qp}`);
    return res.data.data!;
  },

  createContest: async (payload: CreateContestRequest) => {
    const res = await apiClient.post<DataResponse<ContestDetailResponse>>('/admin/contests', payload);
    return res.data.data!;
  },

  getContestById: async (id: number) => {
    const res = await apiClient.get<DataResponse<ContestDetailResponse>>(`/admin/contests/${id}`);
    return res.data.data!;
  },

  updateContest: async (id: number, payload: CreateContestRequest) => {
    const res = await apiClient.put<DataResponse<ContestDetailResponse>>(`/admin/contests/${id}`, payload);
    return res.data.data!;
  },

  deleteContest: async (id: number) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/contests/${id}`);
    return res.data.data!;
  },

  // Posts (admin)
  getAdminPosts: async (page = 0, size = 20, search?: string, isBlocked?: boolean) => {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (search && search.trim()) params.search = search.trim();
    if (typeof isBlocked === 'boolean') params.isBlocked = String(isBlocked);
    const qp = new URLSearchParams(params).toString();
    const res = await apiClient.get<DataResponse<PageResponse<AdminPostItem>>>(`/admin/posts?${qp}`);
    return res.data.data!;
  },

  getAdminPostReportQueue: async (page = 0, size = 20, search?: string, isBlocked?: boolean) => {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (search && search.trim()) params.search = search.trim();
    if (typeof isBlocked === 'boolean') params.isBlocked = String(isBlocked);
    const qp = new URLSearchParams(params).toString();
    const res = await apiClient.get<DataResponse<PageResponse<AdminPostItem>>>(`/admin/posts/report-queue?${qp}`);
    return res.data.data!;
  },

  getAdminPostReports: async (postId: number) => {
    const res = await apiClient.get<DataResponse<PostReportResponse[]>>(`/admin/posts/${postId}/reports`);
    return res.data.data!;
  },

  getPostModerationReasonTemplates: async () => {
    const res = await apiClient.get<DataResponse<ModerationReasonTemplate[]>>('/admin/posts/moderation-reasons');
    return res.data.data!;
  },

  deleteAdminPost: async (id: number, payload: ModeratePostPayload) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/posts/${id}`, { data: payload });
    return res.data.data!;
  },

  toggleAdminPostBlock: async (id: number, payload: ModeratePostPayload) => {
    const res = await apiClient.put<DataResponse<string>>(`/admin/posts/${id}/toggle-block`, payload);
    return res.data.data!;
  },

  addProblemToContest: async (id: number, payload: ContestProblemRequest) => {
    const res = await apiClient.post<DataResponse<string>>(`/admin/contests/${id}/problems`, payload);
    return res.data.data!;
  },

  removeProblemFromContest: async (id: number, problemId: number) => {
    const res = await apiClient.delete<DataResponse<string>>(`/admin/contests/${id}/problems/${problemId}`);
    return res.data.data!;
  },

  getContestRegistrations: async (id: number) => {
    const res = await apiClient.get<DataResponse<any[]>>(`/admin/contests/${id}/registrations`);
    return res.data.data!;
  },

  toggleContestVisibility: async (id: number) => {
    const res = await apiClient.put<DataResponse<string>>(`/admin/contests/${id}/toggle-visibility`);
    return res.data.data!;
  },
};
// ...existing code...