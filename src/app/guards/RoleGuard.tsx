import { Navigate, Outlet } from 'react-router-dom';
import type { Permission } from '@/features/permissions/model/permissions';
import { hasPermission } from '@/features/permissions/model/permissions';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';

export const RoleGuard = ({ permission }: { permission: Permission }) => {
  const { data: user } = useCurrentUser();
  if (!hasPermission(user?.role, permission)) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
};
