import { useState } from 'react';
import { ReferenceReportModal } from '@/features/reports/ui/ReferenceReportModal';
import { Button, PageHeader } from '@/shared/ui';

export const FullAccessPage = () => {
  const [reportOpen, setReportOpen] = useState(false);
  return (
    <>
      <PageHeader title="Справка" subtitle="Формирование отчетов и выгрузок" actions={<Button onClick={() => setReportOpen(true)}>Справка XLSX</Button>} />
      <div className="card">Доступны регламентные отчеты и выгрузки текущих таблиц.</div>
      <ReferenceReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
};
