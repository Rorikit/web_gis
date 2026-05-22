import { useState } from 'react';
import { reportsApi } from '@/shared/api/reports.api';
import { downloadBlob } from '@/shared/lib/download';
import { Button, DatePicker, FormField, Modal } from '@/shared/ui';
import { useToastStore } from '@/shared/store/toast-store';

export const ReferenceReportModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const push = useToastStore((state) => state.push);

  const submit = async () => {
    try {
      setLoading(true);
      const blob = await reportsApi.createReference({ reportDate });
      downloadBlob(blob, `Справка-${reportDate}.xlsx`);
      push({ kind: 'success', title: 'Справка сформирована' });
    } catch {
      push({ kind: 'error', title: 'Ошибка выгрузки файла' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Справка XLSX" onClose={onClose}>
      <div className="form-grid">
        <FormField label="Дата отчета">
          <DatePicker value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
        </FormField>
      </div>
      <div style={{ marginTop: 16 }}>
        <Button onClick={submit} disabled={loading}>Сформировать XLSX</Button>
      </div>
    </Modal>
  );
};
