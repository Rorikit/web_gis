import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { OrdersTable } from '@/features/orders/ui/OrdersTable';
import { ReferenceReportModal } from '@/features/reports/ui/ReferenceReportModal';
import { ExportTableButton } from '@/widgets/table-toolbar/ExportTableButton';
import { Button, PageHeader, PageToolbar } from '@/shared/ui';

export const OoppprPage = () => {
  const [reportOpen, setReportOpen] = useState(false);
  const query = useOrders(false);
  return (
    <>
      <PageHeader title="ООППР" actions={<Button onClick={() => setReportOpen(true)}>Справка XLSX</Button>} />
      <PageToolbar>
        <Button variant="secondary"><Link to="/oopppr/archive">Архив ООППР</Link></Button>
        <ExportTableButton entityType="orders" fileName="ООППР.xlsx" />
      </PageToolbar>
      <OrdersTable data={query.data ?? []} isLoading={query.isLoading} isError={query.isError} />
      <ReferenceReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
};
