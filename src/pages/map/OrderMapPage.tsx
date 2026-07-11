import { useMemo, useState } from 'react';
import { useGisArchivedOrders, useGisOpenOrders } from '@/features/gis/hooks/useGis';
import { GisSidebar } from '@/features/gis/ui/GisSidebar';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { OrderGisMapWidget } from '@/widgets/gis-map/OrderGisMapWidget';
import { PageHeader, Skeleton } from '@/shared/ui';

export const OrderMapPage = () => {
  const [archiveMode, setArchiveMode] = useState(false);
  const [district, setDistrict] = useState('');
  const openOrders = useGisOpenOrders();
  const archivedOrders = useGisArchivedOrders();
  const activeQuery = archiveMode ? archivedOrders : openOrders;
  const accessibleData = useDistrictFilter(activeQuery.data);
  const data = useMemo(
    () => (district ? accessibleData.filter((order) => order.districtId === district) : accessibleData),
    [accessibleData, district],
  );
  return (
    <>
      <PageHeader title="Карта ордеров" />
      <div className="map-layout">
        <GisSidebar archiveMode={archiveMode} onArchiveMode={setArchiveMode} district={district} onDistrictChange={setDistrict} />
        {activeQuery.isLoading ? <Skeleton rows={8} /> : <OrderGisMapWidget orders={data} />}
      </div>
    </>
  );
};
