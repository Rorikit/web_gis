import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Order } from '@/entities';
import { AuditHistoryTable } from '@/features/audit-history/ui/AuditHistoryTable';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useUpdateOrder } from '@/features/orders/hooks/useOrders';
import { hasPermission } from '@/features/permissions/model/permissions';
import { GisMiniPreview } from '@/features/gis/ui/GisMiniPreview';
import { Button, FormField, Input, Select, Tabs, Textarea } from '@/shared/ui';
import { useState } from 'react';

const schema = z.object({
  contractorName: z.string(),
  contractNumber: z.string(),
  plannedFinishDate: z.string(),
  note: z.string(),
});

type OrderForm = z.infer<typeof schema>;

export const OrderCard = ({ order }: { order: Order }) => {
  const [tab, setTab] = useState('order');
  const { data: user } = useCurrentUser();
  const update = useUpdateOrder(order.id);
  const canEditOrder = hasPermission(user?.role, 'order.update');
  const canEditOopppr = hasPermission(user?.role, 'ooppprFields.update');
  const { register, handleSubmit } = useForm<OrderForm>({
    defaultValues: {
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
          <FormField label="Адрес"><Input disabled={!canEditOrder} defaultValue={order.address} /></FormField>
          <FormField label="Тип ордера"><Select disabled={!canEditOrder} defaultValue={order.orderKind}><option>Текущий</option><option>Гарантийный</option></Select></FormField>
        </div>
      ),
    },
    {
      id: 'improvement',
      label: 'Благоустройство',
      content: <FormField label="Состояние"><Select disabled={!canEditOrder} defaultValue={order.areaState}><option>В РАБОТЕ</option><option>ГОТОВ К ЗАКРЫТИЮ</option></Select></FormField>,
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
    { id: 'gis', label: 'GIS', content: <GisMiniPreview point={order.gisPoint} /> },
    { id: 'history', label: 'История', content: <AuditHistoryTable entityType="order" entityId={order.id} /> },
  ];

  return (
    <form className="card" onSubmit={handleSubmit((values) => update.mutate(schema.parse(values)))}>
      <h2 className="section-title">Карточка ордера</h2>
      <Tabs items={tabs} activeId={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        <Button type="submit" disabled={update.isPending || (!canEditOrder && !canEditOopppr)}>Сохранить</Button>
      </div>
    </form>
  );
};
