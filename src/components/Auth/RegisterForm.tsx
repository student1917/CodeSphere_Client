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

const registerSchema = z
  .object({
    username: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const otpSchema = z.object({
  otp: z.string().length(4, 'OTP must be exactly 4 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

const RegisterForm = () => {
  const { registerInit, verifyRegister } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerInit({
        email: data.email,
        password: data.password,
        username: data.username,
      });
      setPendingEmail(data.email);
      setStep(2);
    } catch (error) {
      // toast handled inside useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpFormData) => {
    setIsVerifying(true);
    try {
      await verifyRegister({
        email: pendingEmail,
        otp: data.otp,
      });
      navigate(ROUTES.HOME);
    } catch (error) {
      // toast handled inside useAuth
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 1 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            {...register('username')}
            error={errors.username?.message}
            placeholder="John Doe"
            required
          />

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
            helperText="Minimum 6 characters"
            required
          />

          <Input
            label="Confirm password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="••••••••"
            required
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Send registration OTP
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmitOtp(onVerifyOtp)} className="space-y-4">
          <div className="text-sm text-gray-600">
            OTP code has been sent to <span className="font-semibold">{pendingEmail}</span>. Please check your inbox and enter the code below.
          </div>
          <Input
            label="OTP"
            type="text"
            {...registerOtp('otp')}
            error={otpErrors.otp?.message}
            placeholder="Enter OTP code"
            required
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isVerifying}>
            Verify OTP &amp; sign in
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setStep(1)}
            disabled={isVerifying}
          >
            Go back
          </Button>
        </form>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      <GoogleAuthButton />

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in now
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;

