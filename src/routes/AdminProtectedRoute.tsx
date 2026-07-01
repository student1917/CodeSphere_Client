import { Navigate } from 'react-router-dom';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  // Backend returns role like "ROLE_ADMIN"
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : undefined);
  const isAdmin =
    role === 'ROLE_ADMIN' ||
    role === 'ADMIN' ||
    (Array.isArray(user?.roles) && user.roles.includes('ROLE_ADMIN'));

  if (!isAdmin) return <Navigate to={ROUTES.HOME} replace />;

  return <>{children}</>;
};

export default AdminProtectedRoute;