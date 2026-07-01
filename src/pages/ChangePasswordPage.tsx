import ChangePasswordForm from '@/components/Auth/ChangePasswordForm';
import MainLayout from '@/components/Layout/MainLayout';

const ChangePasswordPage = () => {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Change Password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your current password and new password to update your account.
        </p>
        <div className="bg-white rounded-xl shadow p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </MainLayout>
  );
};

export default ChangePasswordPage;

