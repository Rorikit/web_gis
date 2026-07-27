import { useOrders } from '@/features/orders/hooks/useOrders';
import { OrdersTable } from '@/features/orders/ui/OrdersTable';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { PageHeader, PageToolbar } from '@/shared/ui';

export const OoppprArchivePage = () => {
  const query = useOrders(true);
  return (
    <>
      <PageHeader title="Архив ООППР" />
      <PageToolbar>
        <ExportTableButton entityType="orders" archived fileName="Архив-ООППР.xlsx" />
      </PageToolbar>
      <OrdersTable data={query.data ?? []} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
