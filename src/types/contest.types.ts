import type { ProblemResponse } from './common.types';

export interface ContestResponse {
  id: number;
  title: string;
  description: string;
  contestType: 'PRACTICE' | 'OFFICIAL';
  durationMinutes?: number; // Chỉ có cho PRACTICE contest
  startTime: string | null;
  endTime: string | null;
  registrationStartTime: string | null; // Nullable, không cần nữa
  registrationEndTime: string | null; // Nullable, không cần nữa
  isPublic: boolean;
  hasAccessCode: boolean;
  isHidden?: boolean; // true = ẩn khỏi danh sách public (chỉ admin thấy)
  status: 'UPCOMING' | 'REGISTRATION' | 'ONGOING' | 'ENDED' | 'AVAILABLE';
  authorId: number;
  authorName: string;
  isRegistered: boolean;
  totalProblems: number;
  totalRegistrations: number;
}

export interface ContestDetailResponse {
  id: number;
  title: string;
  description: string;
  contestType: 'PRACTICE' | 'OFFICIAL';
  durationMinutes?: number; // Chỉ có cho PRACTICE contest
  startTime: string | null;
  endTime: string | null;
  registrationStartTime: string | null; // Nullable, không cần nữa
  registrationEndTime: string | null; // Nullable, không cần nữa
  isPublic: boolean;
  hasAccessCode: boolean;
  status: 'UPCOMING' | 'REGISTRATION' | 'ONGOING' | 'ENDED' | 'AVAILABLE';
  authorId: number;
  authorName: string;
  isRegistered: boolean;
  totalRegistrations: number;
  startedAt?: string | null; // Thời gian user bắt đầu (chỉ cho PRACTICE contest)
  endedAt?: string | null; // Thời gian user kết thúc (chỉ cho PRACTICE contest)
  problems: ContestProblemResponse[];
}

export interface ContestProblemResponse {
  problemId: number;
  order: string; // A, B, C, D, etc.
  points: number;
  problem: ProblemResponse;
  isSolved: boolean;
  bestScore: number;
}

export interface ContestLeaderboardResponse {
  rank: number;
  userId: number;
  username: string;
  totalScore: number;
  problemScores: Record<string, number>; // Key: problem order (A, B, C...), Value: score
  completedAt?: string | null; // Thời gian hoàn thành contest
  completionTimeSeconds?: number | null; // Thời gian làm bài tính bằng giây (endedAt - startedAt)
  lastSubmissionTime: string | null;
  totalSubmissions: number;
}

export interface RegisterContestRequest {
  accessCode?: string;
}

export interface CreateContestRequest {
  title: string;
  description?: string;
  contestType: 'PRACTICE' | 'OFFICIAL';
  durationMinutes?: number; // Required cho PRACTICE, null cho OFFICIAL
  startTime?: string | null; // Nullable cho PRACTICE, required cho OFFICIAL
  endTime?: string | null; // Nullable cho PRACTICE, required cho OFFICIAL
  registrationStartTime?: string | null; // Nullable, không cần nữa
  registrationEndTime?: string | null; // Nullable, không cần nữa
  isPublic: boolean;
  accessCode?: string;
  problems?: ContestProblemRequest[];
}

export interface ContestProblemRequest {
  problemId: number;
  order: string;
  points: number;
}

export interface ContestSubmissionResponse {
  id: number;
  submissionId: number;
  problemId: number;
  problemTitle: string;
  problemOrder: string; // A, B, C
  score: number;
  isAccepted: boolean;
  language: string;
  submittedAt: string;
  statusMsg: string;
  runtime: number;
  memory: number;
  codeContent?: string; // Code đã submit
}

export interface ContestRegistrationResponse {
  userId: number;
  username: string;
  avatar: string | null;
  registeredAt: string;
}

