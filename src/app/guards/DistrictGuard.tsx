import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { canAccessDistrict } from '@/features/permissions/model/permissions';

export const DistrictGuard = ({ districtId }: { districtId?: string }) => {
  const { data: user } = useCurrentUser();
  const params = useParams();
  const recordDistrictId = districtId ?? params.districtId;
  if (recordDistrictId && !canAccessDistrict(user?.role, user?.districtId, recordDistrictId)) {
    return <Navigate to="/access-denied" replace />;
  }
  return <Outlet />;
};
