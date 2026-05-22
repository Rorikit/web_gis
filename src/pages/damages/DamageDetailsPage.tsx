import { Navigate, useParams } from 'react-router-dom';
import { useDamage } from '@/features/damages/hooks/useDamages';
import { DamageCard } from '@/widgets/damage-card/DamageCard';
import { ErrorState, PageHeader, Skeleton } from '@/shared/ui';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { canAccessDistrict } from '@/features/permissions/model/permissions';

export const DamageDetailsPage = () => {
  const { id = '' } = useParams();
  const { data: user } = useCurrentUser();
  const query = useDamage(id);
  if (query.isLoading) return <Skeleton rows={8} />;
  if (query.isError || !query.data) return <ErrorState title="Повреждение не найдено" />;
  if (!canAccessDistrict(user?.role, user?.districtId, query.data.districtId)) return <Navigate to="/access-denied" replace />;
  return (
    <>
      <PageHeader title={`Повреждение ${query.data.id}`} subtitle={query.data.address} />
      <DamageCard damage={query.data} />
    </>
  );
};
