import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import Input from '@/components/Input';
import Button from '@/components/Button';
import GoogleAuthButton from './GoogleAuthButton';
import { ROUTES } from '@/utils/constants';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password cannot be empty'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const user = await login(data);
      // Kiểm tra role và redirect đến admin nếu là admin
      const role = user?.role || '';
      if (role === 'ROLE_ADMIN' || role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(ROUTES.HOME);
      }
    } catch (error) {
      // Error đã được xử lý trong AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="your.email@example.com"
        required
      />

      <Input
        label="Password"
        type="password"
        {...register('password')}
        error={errors.password?.message}
        placeholder="••••••••"
        required
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer" 
          />
          <span className="ml-2 text-sm text-gray-700">Remember me</span>
        </label>
        <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          Forgot password?
        </Link>
      </div>

      <Button 
        type="submit" 
        variant="primary" 
        className="w-full py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02]" 
        isLoading={isLoading}
      >
        Sign in
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white/80 text-gray-500 font-medium">Or</span>
        </div>
      </div>

      <GoogleAuthButton />

      <p className="text-center text-sm text-gray-600 pt-2">
        Don't have an account?{' '}
        <Link 
          to={ROUTES.REGISTER} 
          className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Sign up now
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;

