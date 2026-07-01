import ForgotPasswordForm from '@/components/Auth/ForgotPasswordForm';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full mx-auto relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <div className="text-center mb-6">
            <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2 mb-4">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="forgotLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <circle cx="22" cy="22" r="20" fill="url(#forgotLogoGradient)" opacity="0.15" />
                  <path
                    d="M13 15L9 19L13 23M31 15L35 19L31 23"
                    stroke="url(#forgotLogoGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="22" cy="19" r="2.5" fill="url(#forgotLogoGradient)" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                CodeSphere
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu</h2>
            <p className="text-sm text-gray-600">Nhập email để nhận OTP và đặt lại mật khẩu</p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

