import { useState } from 'react';
import type { Damage } from '@/entities';
import { reportsApi } from '@/shared/api/reports.api';
import { downloadBlob } from '@/shared/lib/download';
import { Button, FormField, Modal, Textarea } from '@/shared/ui';
import { useToastStore } from '@/shared/store/toast-store';

export const DamageCardReportModal = ({ damage, open, onClose }: { damage: Damage; open: boolean; onClose: () => void }) => {
  const [additionalInfo, setAdditionalInfo] = useState('');
  const push = useToastStore((state) => state.push);

  const submit = async () => {
    try {
      const blob = await reportsApi.createDamageCard({ damageId: damage.id, additionalInfo });
      downloadBlob(blob, `Карта-повреждения-${damage.id}.docx`);
      push({ kind: 'success', title: 'Карта повреждения сформирована' });
    } catch {
      push({ kind: 'error', title: 'Ошибка выгрузки файла' });
    }
  };

  return (
    <Modal open={open} title="Карта повреждения DOCX" onClose={onClose}>
      <FormField label="Дополнительные сведения">
        <Textarea value={additionalInfo} onChange={(event) => setAdditionalInfo(event.target.value)} />
      </FormField>
      <div style={{ marginTop: 16 }}>
        <Button onClick={submit}>Сформировать DOCX</Button>
      </div>
    </Modal>
  );
};
