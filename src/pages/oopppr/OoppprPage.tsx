import { useState } from 'react';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { OrdersTable } from '@/features/orders/ui/OrdersTable';
import { ReferenceReportModal } from '@/features/reports/ui/ReferenceReportModal';
import { Button, PageHeader } from '@/shared/ui';

export const OoppprPage = () => {
  const [reportOpen, setReportOpen] = useState(false);
  const query = useOrders(false);
  return (
    <>
      <PageHeader title="ООППР" actions={<Button onClick={() => setReportOpen(true)}>Справка XLSX</Button>} />
      <OrdersTable data={query.data ?? []} isLoading={query.isLoading} isError={query.isError} />
      <ReferenceReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
};
