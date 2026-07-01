import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UserProfileResponse,
  UpdateProfileRequest,
  RegisterInitRequest,
  RegisterVerifyRequest,
  ForgotPasswordInitRequest,
  ForgotPasswordVerifyRequest,
  ChangePasswordRequest,
} from '@/types/auth.types';

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<DataResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  registerInit: async (data: RegisterInitRequest): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>('/auth/register/init', data);
    return response.data.data!;
  },

  registerVerify: async (data: RegisterVerifyRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<DataResponse<AuthResponse>>('/auth/register/verify', data);
    return response.data.data!;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<DataResponse<AuthResponse>>('/auth/login', data);
    return response.data.data!;
  },

  googleAuth: async (): Promise<string> => {
    const response = await apiClient.get<DataResponse<string>>('/auth/google');
    return response.data.data!;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<DataResponse<UserProfileResponse>>('/users/me/profile');
    const profile = response.data.data!;
    return {
      id: profile.userId, // Backend trả về userId, map sang id
      email: profile.email,
      username: profile.username,
      role: profile.role || 'USER',
      avatar: profile.avatar || undefined,
    };
  },

  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<DataResponse<UserProfileResponse>>('/users/me/profile');
    return response.data.data!;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
    const response = await apiClient.put<DataResponse<UserProfileResponse>>('/users/me/profile', data);
    return response.data.data!;
  },

  uploadAvatar: async (file: File): Promise<UserProfileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<DataResponse<UserProfileResponse>>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  forgotPasswordInit: async (data: ForgotPasswordInitRequest): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>('/auth/forgot-password/init', data);
    return response.data.data!;
  },

  forgotPasswordVerify: async (data: ForgotPasswordVerifyRequest): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>('/auth/forgot-password/verify', data);
    return response.data.data!;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>('/auth/change-password', data);
    return response.data.data!;
  },
};

