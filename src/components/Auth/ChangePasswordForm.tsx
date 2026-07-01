import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

const schema = z
  .object({
    oldPassword: z.string().min(1, 'Please enter your current password'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Confirm password does not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const ChangePasswordForm = () => {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Current Password"
        type="password"
        {...register('oldPassword')}
        error={errors.oldPassword?.message}
        required
      />
      <Input
        label="New Password"
        type="password"
        {...register('newPassword')}
        error={errors.newPassword?.message}
        required
      />
      <Input
        label="Confirm New Password"
        type="password"
        {...register('confirmPassword')}
        error={errors.confirmPassword?.message}
        required
      />
      <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
        Change Password
      </Button>
    </form>
  );
};

export default ChangePasswordForm;

