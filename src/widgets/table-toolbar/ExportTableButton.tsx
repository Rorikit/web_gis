import { useState } from 'react';
import type { ExportCurrentTablePayload } from '@/shared/api/exports.api';
import { exportsApi } from '@/shared/api/exports.api';
import { downloadBlob } from '@/shared/lib/download';
import { Button } from '@/shared/ui';
import { useToastStore } from '@/shared/store/toast-store';

export const ExportTableButton = ({ entityType, archived = false, fileName = 'export.xlsx' }: ExportCurrentTablePayload & { fileName?: string }) => {
  const [loading, setLoading] = useState(false);
  const push = useToastStore((state) => state.push);

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await exportsApi.currentTable({ entityType, archived });
      downloadBlob(blob, fileName);
    } catch {
      push({ kind: 'error', title: 'Ошибка выгрузки файла' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} disabled={loading}>Выгрузить в эксель</Button>
  );
};
