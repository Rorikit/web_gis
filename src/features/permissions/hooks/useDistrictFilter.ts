import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { canAccessDistrict } from '@/features/permissions/model/permissions';

export const useDistrictFilter = <T extends { districtId: string }>(data: T[] | undefined) => {
  const { data: user } = useCurrentUser();
  return (data ?? []).filter((item) => canAccessDistrict(user?.role, user?.districtId, item.districtId));
};
