export interface UserManagementResponse {
  id: number;
  username: string;
  email: string | null;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string;
  totalSubmissions: number;
  totalSolved: number;
}

export interface AuditLogItem {
  id: number;
  actorId: number | null;
  actorUsername: string | null;
  actorRole: string | null;
  action: string;
  objectType: string;
  objectId: number | null;
  objectLabel: string | null;
  beforeState: string | null;
  afterState: string | null;
  changeSummary: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface SubmissionTrendPoint {
  date: string;
  submissions: number;
  accepted: number;
  accuracyRate: number;
}

export interface DashboardStatsResponse {
  totalUsers: number;
  totalProblems: number;
  totalContests: number;
  totalSubmissions: number;
  activeUsers: number;
  activeNow: number;
  blockedUsers: number;
  administrators: number;
  newUsersThisMonth: number;
  submissionsToday: number;

  newPostsToday: number;
  newPostsThisWeek: number;
  violationReportsToday: number;
  violationReportsThisWeek: number;
  moderationHandledToday: number;
  moderationHandledThisWeek: number;
  avgModerationHoursToday: number;
  avgModerationHoursThisWeek: number;
  restoreRateThisWeek: number;

  spamSpikeAlert: boolean;
  postingSpikeAlert: boolean;
  alertMessage: string | null;

  submissionTrend: SubmissionTrendPoint[];
}

