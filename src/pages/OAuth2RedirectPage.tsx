import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '@/utils/storage';
import { ROUTES } from '@/utils/constants';
import { authApi } from '@/apis/auth.api';
import type { User } from '@/types/auth.types';
import toast from 'react-hot-toast';

const OAuth2RedirectPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        toast.error('Không nhận được token từ Google. Vui lòng thử lại.');
        navigate(ROUTES.LOGIN);
        return;
      }

      try {
        // Lưu token trước
        storage.setToken(token);
        
        // Gọi API để lấy thông tin user
        const userData: User = await authApi.getCurrentUser();
        
        // Lưu user info vào storage
        storage.setUser(userData);
        
        toast.success('Đăng nhập Google thành công!');
        
        // Force reload để AuthContext tự động load user từ storage
        window.location.href = ROUTES.HOME;
      } catch (error: any) {
        console.error('OAuth2 callback error:', error);
        toast.error('Lỗi xử lý đăng nhập Google. Vui lòng thử lại.');
        storage.clear();
        navigate(ROUTES.LOGIN);
      }
    };

    handleOAuth2Callback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
};

export default OAuth2RedirectPage;

