import { useOrders } from '@/features/orders/hooks/useOrders';
import { OrdersTable } from '@/features/orders/ui/OrdersTable';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { PageHeader, PageToolbar } from '@/shared/ui';

export const OrderArchivePage = () => {
  const query = useOrders(true);
  const data = useDistrictFilter(query.data);
  return (
    <>
      <PageHeader title="Архив ордеров" />
      <PageToolbar>
        <ExportTableButton entityType="orders" archived fileName="Архив-ордеров.xlsx" />
      </PageToolbar>
      <OrdersTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
