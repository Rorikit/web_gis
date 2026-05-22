import { useOrders } from '@/features/orders/hooks/useOrders';
import { OrdersTable } from '@/features/orders/ui/OrdersTable';
import { PageHeader } from '@/shared/ui';

export const OoppprArchivePage = () => {
  const query = useOrders(true);
  return (
    <>
      <PageHeader title="Архив ООППР" />
      <OrdersTable data={query.data ?? []} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
