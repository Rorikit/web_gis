import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { landingPathByRole } from '@/features/permissions/model/permissions';

export const IndexRedirect = () => {
  const { data: user } = useCurrentUser();
  const to = user?.role ? landingPathByRole[user.role] : '/dashboard';
  return <Navigate to={to} replace />;
};
