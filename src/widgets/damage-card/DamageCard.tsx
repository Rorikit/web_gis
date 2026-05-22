import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Damage } from '@/entities';
import { AuditHistoryTable } from '@/features/audit-history/ui/AuditHistoryTable';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useUpdateDamage } from '@/features/damages/hooks/useDamages';
import { useSaveDamagePoint } from '@/features/gis/hooks/useGis';
import { GisMiniPreview } from '@/features/gis/ui/GisMiniPreview';
import { GisPointPicker } from '@/features/gis/ui/GisPointPicker';
import { hasPermission } from '@/features/permissions/model/permissions';
import { DamageCardReportModal } from '@/features/reports/ui/DamageCardReportModal';
import { Button, Checkbox, FormField, Input, Select, Tabs, Textarea } from '@/shared/ui';

const schema = z.object({
  address: z.string().min(3),
  heatSource: z.string().min(1),
  damageDescription: z.string().min(1),
  note: z.string(),
});

type DamageForm = z.infer<typeof schema>;

export const DamageCard = ({ damage }: { damage: Damage }) => {
  const [tab, setTab] = useState('main');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const update = useUpdateDamage(damage.id);
  const savePoint = useSaveDamagePoint(damage.id);
  const canEditMain = hasPermission(user?.role, 'damage.update');
  const { register, handleSubmit, reset } = useForm<DamageForm>({
    defaultValues: {
      address: damage.address,
      heatSource: damage.heatSource,
      damageDescription: damage.damageDescription,
      note: damage.note,
    },
  });

  const disabled = !canEditMain || update.isPending;
  const onSubmit = (values: DamageForm) => {
    const result = schema.safeParse(values);
    if (result.success) update.mutate(result.data);
  };

  const tabs = useMemo(
    () => [
      {
        id: 'main',
        label: 'Основное',
        content: (
          <div className="form-grid">
            <FormField label="Адрес"><Input disabled={disabled} {...register('address')} /></FormField>
            <FormField label="ОТ/ГВС"><Select disabled={disabled} defaultValue={damage.networkType}><option>ОТ</option><option>ГВС</option></Select></FormField>
            <FormField label="Тип повреждения"><Select disabled={disabled} defaultValue={damage.damageType}><option>Текущее</option><option>Гидравлическое</option></Select></FormField>
            <FormField label="Источник тепла"><Input disabled={disabled} {...register('heatSource')} /></FormField>
            <FormField label="Описание"><Textarea disabled={disabled} {...register('damageDescription')} /></FormField>
            <FormField label="Примечание"><Textarea disabled={disabled} {...register('note')} /></FormField>
          </div>
        ),
      },
      {
        id: 'order',
        label: 'Ордер',
        content: (
          <div className="details-grid">
            <div className="details-item"><span>№ ордера</span>{damage.orderNumber}</div>
            <div className="details-item"><span>Открыт</span>{damage.orderOpenedAt}</div>
            <div className="details-item"><span>Действует до</span>{damage.orderValidUntil}</div>
            <div className="details-item"><span>Закрыт</span>{damage.orderClosedAt ?? '-'}</div>
          </div>
        ),
      },
      {
        id: 'improvement',
        label: 'Благоустройство',
        content: (
          <div className="form-grid">
            <FormField label="Зеленая зона"><Input disabled={disabled} defaultValue={damage.greenZoneArea} /></FormField>
            <FormField label="Асфальт"><Input disabled={disabled} defaultValue={damage.asphaltArea} /></FormField>
            <FormField label="Бортовой камень"><Input disabled={disabled} defaultValue={damage.curbCount} /></FormField>
            <FormField label="Проезжая часть"><Checkbox disabled={disabled} defaultChecked={damage.improvementMain} /></FormField>
            <FormField label="Тротуар"><Checkbox disabled={disabled} defaultChecked={damage.improvementSidewalk} /></FormField>
          </div>
        ),
      },
      {
        id: 'photo',
        label: 'Фото',
        content: (
          <>
            <Button variant="secondary">Загрузить фото</Button>
            <div className="photo-grid" style={{ marginTop: 12 }}>
              {damage.photos.map((photo) => <div key={photo.id} className="photo-tile">{photo.fileName}</div>)}
            </div>
          </>
        ),
      },
      { id: 'history', label: 'История', content: <AuditHistoryTable entityType="damage" entityId={damage.id} /> },
    ],
    [damage, disabled, register],
  );

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="section-title">Карточка повреждения</h2>
      <Tabs items={tabs} activeId={tab} onChange={setTab} />

      <section className="damage-gis-section">
        <div className="damage-gis-section__header">
          <h3 className="section-title">GIS</h3>
          <div className="damage-gis-section__actions">
            <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>Указать точку</Button>
            <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>Изменить</Button>
            <Button type="button" variant="secondary" onClick={() => damage.gisPoint?.mapUrl && window.open(damage.gisPoint.mapUrl)}>Открыть карту</Button>
          </div>
        </div>
        <div className="damage-gis-section__content">
          <GisMiniPreview point={damage.gisPoint} />
          <div className="damage-gis-section__meta">
            <div className="details-item">
              <span>Адрес GIS</span>
              {damage.gisPoint?.address ?? damage.address}
            </div>
            <div className="details-item">
              <span>Координаты</span>
              {damage.gisPoint ? `${damage.gisPoint.latitude.toFixed(6)}, ${damage.gisPoint.longitude.toFixed(6)}` : 'Не указаны'}
            </div>
            <div className="details-item">
              <span>GIS object ID</span>
              {damage.gisPoint?.gisObjectId ?? '-'}
            </div>
            <div className="details-item">
              <span>Статус точки</span>
              {damage.gisPoint ? 'Точка указана' : 'Точка не указана'}
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button type="submit" disabled={disabled}>Сохранить</Button>
        <Button type="button" variant="secondary" onClick={() => reset()}>Отмена</Button>
        <Button type="button" variant="secondary" onClick={() => setReportOpen(true)}>Карта повреждения DOCX</Button>
      </div>
      <GisPointPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSave={(point) => savePoint.mutate(point, { onSuccess: () => setPickerOpen(false) })} />
      <DamageCardReportModal damage={damage} open={reportOpen} onClose={() => setReportOpen(false)} />
    </form>
  );
};
