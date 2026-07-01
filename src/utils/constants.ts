// API Configuration từ environment variables
// Trong Vite, biến môi trường phải có prefix VITE_ để được expose
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// OAuth2 Configuration
export const OAUTH2_REDIRECT_URI = import.meta.env.VITE_OAUTH2_REDIRECT_URI || 'http://localhost:5173/oauth2/redirect';

// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'CodeSphere';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  CHANGE_PASSWORD: '/change-password',
  OAUTH2_REDIRECT: '/oauth2/redirect',
  PROBLEMS: '/problems',
  CONTEST: '/contest',
  DISCUSS: '/discuss',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
  SUBMISSIONS: '/submissions',
  MESSAGES: '/messages',
  NOTIFICATIONS: '/notifications',
  CREATE_POST: '/discuss/create',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;

