import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { Skeleton } from '@/shared/ui';

export const AuthGuard = () => {
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <Skeleton rows={6} />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <Outlet />;
};
