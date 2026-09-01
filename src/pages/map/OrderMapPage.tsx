import { useMemo, useState } from 'react';
import { useGisArchivedOrders, useGisOpenOrders } from '@/features/gis/hooks/useGis';
import { GisSidebar, type OrderMapFilters } from '@/features/gis/ui/GisSidebar';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { OrderGisMapWidget } from '@/widgets/gis-map/OrderGisMapWidget';
import { PageHeader, Skeleton } from '@/shared/ui';

const emptyFilters: OrderMapFilters = {
  addressSearch: '',
  district: '',
  orderKind: '',
  status: '',
  periodFrom: '',
  periodTo: '',
  contractor: '',
};

export const OrderMapPage = () => {
  const [archiveMode, setArchiveMode] = useState(false);
  const [filters, setFilters] = useState<OrderMapFilters>(emptyFilters);
  const openOrders = useGisOpenOrders();
  const archivedOrders = useGisArchivedOrders();
  const activeQuery = archiveMode ? archivedOrders : openOrders;
  const accessibleData = useDistrictFilter(activeQuery.data);

  const data = useMemo(() => {
    const search = filters.addressSearch.trim().toLowerCase();
    const contractor = filters.contractor.trim().toLowerCase();
    return accessibleData.filter((order) => {
      if (filters.district && order.districtId !== filters.district) return false;
      if (search && !order.address.toLowerCase().includes(search)) return false;
      if (filters.orderKind && order.orderKind !== filters.orderKind) return false;
      if (filters.status === 'open' && order.closedAt) return false;
      if (filters.status === 'closed' && !order.closedAt) return false;
      if (filters.periodFrom && (!order.openedAt || order.openedAt < filters.periodFrom)) return false;
      if (filters.periodTo && (!order.openedAt || order.openedAt > filters.periodTo)) return false;
      if (contractor && !order.contractorType.toLowerCase().includes(contractor)) return false;
      return true;
    });
  }, [accessibleData, filters]);

  const updateFilters = (patch: Partial<OrderMapFilters>) => setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <>
      <PageHeader title="Карта ордеров" />
      <div className="map-layout">
        <GisSidebar archiveMode={archiveMode} onArchiveMode={setArchiveMode} filters={filters} onFiltersChange={updateFilters} />
        {activeQuery.isLoading ? <Skeleton rows={8} /> : <OrderGisMapWidget orders={data} />}
      </div>
    </>
  );
};
