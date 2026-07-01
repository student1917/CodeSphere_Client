import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

const initSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

const verifySchema = z
  .object({
    otp: z.string().length(4, 'OTP phải có đúng 4 ký tự'),
    newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type InitFormData = z.infer<typeof initSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

const ForgotPasswordForm = () => {
  const { forgotPasswordInit, forgotPasswordVerify } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InitFormData>({
    resolver: zodResolver(initSchema),
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const onInit = async (data: InitFormData) => {
    setLoading(true);
    try {
      await forgotPasswordInit({ email: data.email });
      setEmail(data.email);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (data: VerifyFormData) => {
    setVerifying(true);
    try {
      await forgotPasswordVerify({
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      navigate(ROUTES.LOGIN);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 1 && (
        <form onSubmit={handleSubmit(onInit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="your.email@example.com"
            required
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Gửi OTP
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmitVerify(onVerify)} className="space-y-4">
          <div className="text-sm text-gray-600">
            Nhập OTP đã gửi tới <span className="font-semibold">{email}</span> và mật khẩu mới.
          </div>
          <Input
            label="OTP"
            type="text"
            {...registerVerify('otp')}
            error={verifyErrors.otp?.message}
            placeholder="Nhập mã OTP"
            required
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            {...registerVerify('newPassword')}
            error={verifyErrors.newPassword?.message}
            placeholder="••••••••"
            required
          />
          <Input
            label="Xác nhận mật khẩu"
            type="password"
            {...registerVerify('confirmPassword')}
            error={verifyErrors.confirmPassword?.message}
            placeholder="••••••••"
            required
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={verifying}>
            Đặt lại mật khẩu
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={verifying}
            onClick={() => setStep(1)}
          >
            Quay lại
          </Button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;

