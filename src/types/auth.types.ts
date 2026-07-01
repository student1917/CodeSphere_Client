export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface RegisterInitRequest {
  email: string;
  password: string;
  username: string;
}

export interface RegisterVerifyRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordInitRequest {
  email: string;
}

export interface ForgotPasswordVerifyRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  type: string;
  userId: number;
  email: string;
  username: string;
  role: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  avatar?: string;
}

export interface UserProfileResponse {
  userId: number;
  username: string;
  email: string;
  avatar: string | null;
  dob: string | null; // Date string from backend
  phoneNumber: string | null;
  gender: string | null;
  status: boolean | null;
  lastOnline: string | null; // ISO string
  role: string | null;
  authenWith: number | null; // 0 = Local, 1 = Google
  isBlocked: boolean | null;
  createdAt: string | null; // ISO string
  updatedAt: string | null; // ISO string
}

export interface UpdateProfileRequest {
  username?: string;
  dob?: string | null; // Date string YYYY-MM-DD
  phoneNumber?: string | null;
  gender?: string | null;
}

