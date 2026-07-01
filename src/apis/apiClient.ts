import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import { storage } from '@/utils/storage';
import type { DataResponse } from '@/types/common.types';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<DataResponse<any>>) => {
    if (error.response) {
      const { status, data } = error.response;

      // Unauthorized - Token hết hạn hoặc không hợp lệ
      if (status === 401) {
        storage.clear();
        // Redirect to login nếu không phải đang ở trang login/register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (status === 403) {
        toast.error('Bạn không có quyền truy cập.');
      } else if (status >= 500) {
        toast.error('Lỗi server. Vui lòng thử lại sau.');
      } else {
        // Hiển thị message từ server
        const message = data?.message || error.message || 'Có lỗi xảy ra';
        toast.error(message);
      }
    } else if (error.request) {
      toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    } else {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;

