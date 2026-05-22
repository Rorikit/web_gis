import { Navigate, useParams } from 'react-router-dom';
import { useOrder } from '@/features/orders/hooks/useOrders';
import { OrderCard } from '@/widgets/order-card/OrderCard';
import { ErrorState, PageHeader, Skeleton } from '@/shared/ui';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { canAccessDistrict } from '@/features/permissions/model/permissions';

export const OrderDetailsPage = () => {
  const { id = '' } = useParams();
  const { data: user } = useCurrentUser();
  const query = useOrder(id);
  if (query.isLoading) return <Skeleton rows={8} />;
  if (query.isError || !query.data) return <ErrorState title="Ордер не найден" />;
  if (!canAccessDistrict(user?.role, user?.districtId, query.data.districtId)) return <Navigate to="/access-denied" replace />;
  return (
    <>
      <PageHeader title={`Ордер ${query.data.orderNumber}`} subtitle={query.data.address} />
      <OrderCard order={query.data} />
    </>
  );
};
