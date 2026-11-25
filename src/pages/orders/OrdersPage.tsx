import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { OrdersTable } from '@/features/orders/ui/OrdersTable';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { inDateRange, localToday } from '@/shared/lib/date-range';
import { DateRangeFilter } from '@/widgets/table-toolbar/DateRangeFilter';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { TableToolbar } from '@/widgets/table-toolbar/TableToolbar';
import { Button, Checkbox, Input, PageHeader, PageToolbar } from '@/shared/ui';

export const OrdersPage = () => {
  const [search, setSearch] = useState('');
  const [address, setAddress] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [contractor, setContractor] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [openedFrom, setOpenedFrom] = useState('');
  const [openedTo, setOpenedTo] = useState('');
  const [closedFrom, setClosedFrom] = useState('');
  const [closedTo, setClosedTo] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const query = useOrders(false);
  const districtData = useDistrictFilter(query.data);
  const today = localToday();

  const data = useMemo(
    () => districtData.filter((item) => {
      const matchesSearch = `${item.address} ${item.orderNumber}`.toLowerCase().includes(search.toLowerCase());
      const matchesAddress = !address || item.address.toLowerCase().includes(address.toLowerCase());
      const matchesNumber = !orderNumber || item.orderNumber.toLowerCase().includes(orderNumber.toLowerCase());
      const matchesContractor = !contractor || item.contractorType.toLowerCase().includes(contractor.toLowerCase());
      const matchesContract = !contractNumber || item.contractNumber.toLowerCase().includes(contractNumber.toLowerCase());
      const matchesOpened = inDateRange(item.openedAt, openedFrom, openedTo);
      const matchesClosed = inDateRange(item.closedAt, closedFrom, closedTo);
      const matchesOverdue = !overdueOnly || Boolean(item.validUntil && item.validUntil < today);
      return matchesSearch && matchesAddress && matchesNumber && matchesContractor && matchesContract
        && matchesOpened && matchesClosed && matchesOverdue;
    }),
    [districtData, search, address, orderNumber, contractor, contractNumber, openedFrom, openedTo, closedFrom, closedTo, overdueOnly, today],
  );

  return (
    <>
      <PageHeader title="Ордера" />
      <PageToolbar>
        <Button variant="secondary"><Link to="/orders/archive">Архив ордеров</Link></Button>
        <ExportTableButton entityType="orders" fileName="Ордера.xlsx" />
      </PageToolbar>
      <TableToolbar search={search} onSearch={setSearch}>
        <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Адрес" style={{ width: 180 }} />
        <Input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="№ ордера" style={{ width: 150 }} />
        <Input value={contractor} onChange={(event) => setContractor(event.target.value)} placeholder="Подрядчик" style={{ width: 170 }} />
        <Input value={contractNumber} onChange={(event) => setContractNumber(event.target.value)} placeholder="№ договора" style={{ width: 150 }} />
        <DateRangeFilter label="Открыт" from={openedFrom} to={openedTo} onFrom={setOpenedFrom} onTo={setOpenedTo} />
        <DateRangeFilter label="Закрыт" from={closedFrom} to={closedTo} onFrom={setClosedFrom} onTo={setClosedTo} />
        <label className="filter-checkbox">
          <Checkbox checked={overdueOnly} onChange={(event) => setOverdueOnly(event.target.checked)} />
          Только просроченные
        </label>
      </TableToolbar>
      <OrdersTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
