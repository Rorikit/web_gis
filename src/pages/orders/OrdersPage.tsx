import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { OrdersTable } from '@/features/orders/ui/OrdersTable';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { TableToolbar } from '@/widgets/table-toolbar/TableToolbar';
import { Button, PageHeader, PageToolbar } from '@/shared/ui';

export const OrdersPage = () => {
  const [search, setSearch] = useState('');
  const query = useOrders(false);
  const districtData = useDistrictFilter(query.data);
  const data = useMemo(() => districtData.filter((item) => `${item.address} ${item.orderNumber}`.toLowerCase().includes(search.toLowerCase())), [districtData, search]);
  return (
    <>
      <PageHeader title="Ордера" />
      <PageToolbar>
        <Button variant="secondary"><Link to="/orders/archive">Архив ордеров</Link></Button>
        <ExportTableButton entityType="orders" fileName="Ордера.xlsx" />
      </PageToolbar>
      <TableToolbar search={search} onSearch={setSearch} />
      <OrdersTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
