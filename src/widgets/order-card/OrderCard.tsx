import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Order } from '@/entities';
import { AuditHistoryTable } from '@/features/audit-history/ui/AuditHistoryTable';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useSaveOrderPoint } from '@/features/gis/hooks/useGis';
import { GisMiniPreview } from '@/features/gis/ui/GisMiniPreview';
import { GisPointPicker } from '@/features/gis/ui/GisPointPicker';
import { useUpdateOrder } from '@/features/orders/hooks/useOrders';
import { hasPermission } from '@/features/permissions/model/permissions';
import { Button, FormField, Input, Select, Tabs, Textarea } from '@/shared/ui';

const schema = z.object({
  address: z.string(),
  orderKind: z.enum(['Текущий', 'Гарантийный']),
  areaState: z.enum(['В РАБОТЕ', 'ГОТОВ К ЗАКРЫТИЮ']),
  contractorName: z.string(),
  contractNumber: z.string(),
  plannedFinishDate: z.string(),
  note: z.string(),
});

type OrderForm = z.infer<typeof schema>;

export const OrderCard = ({ order }: { order: Order }) => {
  const [tab, setTab] = useState('order');
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const update = useUpdateOrder(order.id);
  const savePoint = useSaveOrderPoint(order.id);
  const canEditOrder = hasPermission(user?.role, 'order.update');
  const canEditOopppr = hasPermission(user?.role, 'ooppprFields.update');
  const { register, handleSubmit, setValue } = useForm<OrderForm>({
    defaultValues: {
      address: order.address,
      orderKind: order.orderKind,
      areaState: order.areaState,
      contractorName: order.contractorName,
      contractNumber: order.contractNumber,
      plannedFinishDate: order.plannedFinishDate ?? '',
      note: order.note,
    },
  });

  const tabs = [
    {
      id: 'order',
      label: 'Данные ордера',
      content: (
        <div className="form-grid">
          <FormField label="№ ордера"><Input disabled defaultValue={order.orderNumber} /></FormField>
          <FormField label="Адрес"><Input disabled={!canEditOrder} {...register('address')} /></FormField>
          <FormField label="Тип ордера">
            <Select disabled={!canEditOrder} {...register('orderKind')}>
              <option>Текущий</option>
              <option>Гарантийный</option>
            </Select>
          </FormField>
        </div>
      ),
    },
    {
      id: 'improvement',
      label: 'Благоустройство',
      content: (
        <FormField label="Состояние">
          <Select disabled={!canEditOrder} {...register('areaState')}>
            <option>В РАБОТЕ</option>
            <option>ГОТОВ К ЗАКРЫТИЮ</option>
          </Select>
        </FormField>
      ),
    },
    {
      id: 'oopppr',
      label: 'ООППР',
      content: (
        <div className="form-grid">
          <FormField label="Исполнитель"><Input disabled={!canEditOopppr} {...register('contractorName')} /></FormField>
          <FormField label="№ договора"><Input disabled={!canEditOopppr} {...register('contractNumber')} /></FormField>
          <FormField label="Срок выполнения"><Input type="date" disabled={!canEditOopppr} {...register('plannedFinishDate')} /></FormField>
          <FormField label="Примечание"><Textarea disabled={!canEditOopppr} {...register('note')} /></FormField>
        </div>
      ),
    },
    {
      id: 'gis',
      label: 'GIS',
      content: (
        <>
          <div className="damage-gis-section__actions" style={{ marginBottom: 12 }}>
            <Button type="button" variant="secondary" disabled={!canEditOrder} onClick={() => setPickerOpen(true)}>
              {order.gisPoint ? 'Изменить точку' : 'Указать точку'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => order.gisPoint?.mapUrl && window.open(order.gisPoint.mapUrl)}>Открыть карту</Button>
          </div>
          <GisMiniPreview point={order.gisPoint} />
        </>
      ),
    },
    { id: 'history', label: 'История', content: <AuditHistoryTable entityType="order" entityId={order.id} /> },
  ];

  return (
    <form className="card" onSubmit={handleSubmit((values) => update.mutate(schema.parse(values)))}>
      <h2 className="section-title">Карточка ордера</h2>
      <Tabs items={tabs} activeId={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        <Button type="submit" disabled={update.isPending || (!canEditOrder && !canEditOopppr)}>Сохранить</Button>
      </div>
      <GisPointPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSave={({ latitude, longitude, address }) => {
          savePoint.mutate({ latitude, longitude }, { onSuccess: () => setPickerOpen(false) });
          if (address) setValue('address', address);
        }}
      />
    </form>
  );
};
