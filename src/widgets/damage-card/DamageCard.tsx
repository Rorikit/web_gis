import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import type { Damage } from '@/entities';
import { AuditHistoryTable } from '@/features/audit-history/ui/AuditHistoryTable';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useUpdateDamage, useUploadDamagePhoto } from '@/features/damages/hooks/useDamages';
import { useSaveDamagePoint } from '@/features/gis/hooks/useGis';
import { GisMiniPreview } from '@/features/gis/ui/GisMiniPreview';
import { GisPointPicker } from '@/features/gis/ui/GisPointPicker';
import { hasPermission } from '@/features/permissions/model/permissions';
import { DamageCardReportModal } from '@/features/reports/ui/DamageCardReportModal';
import { Button, Checkbox, FormField, Input, Select, Tabs, Textarea } from '@/shared/ui';

const schema = z.object({
  address: z.string(),
  networkType: z.enum(['ОТ', 'ГВС']),
  damageType: z.enum(['Текущее', 'Гидравлическое']),
  heatSource: z.string(),
  damageDescription: z.string(),
  note: z.string(),
  greenZoneArea: z.number(),
  asphaltArea: z.number(),
  curbCount: z.number(),
  improvementMain: z.boolean(),
  improvementSidewalk: z.boolean(),
});

type DamageForm = z.infer<typeof schema>;

export const DamageCard = ({ damage }: { damage: Damage }) => {
  const [tab, setTab] = useState('main');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const { data: user } = useCurrentUser();
  const update = useUpdateDamage(damage.id);
  const savePoint = useSaveDamagePoint(damage.id);
  const uploadPhoto = useUploadDamagePhoto(damage.id);
  const canEditMain = hasPermission(user?.role, 'damage.update');
  const { register, handleSubmit, reset, setValue } = useForm<DamageForm>({
    defaultValues: {
      address: damage.address,
      networkType: damage.networkType,
      damageType: damage.damageType,
      heatSource: damage.heatSource,
      damageDescription: damage.damageDescription,
      note: damage.note,
      greenZoneArea: damage.greenZoneArea,
      asphaltArea: damage.asphaltArea,
      curbCount: damage.curbCount,
      improvementMain: damage.improvementMain,
      improvementSidewalk: damage.improvementSidewalk,
    },
  });

  const disabled = !canEditMain || update.isPending;
  const onSubmit = (values: DamageForm) => {
    const result = schema.safeParse(values);
    if (result.success) update.mutate(result.data, { onSuccess: () => navigate('/damages') });
  };

  const tabs = useMemo(
    () => [
      {
        id: 'main',
        label: 'Основное',
        content: (
          <div className="form-grid">
            <FormField label="Адрес"><Input disabled={disabled} {...register('address')} /></FormField>
            <FormField label="ОТ/ГВС">
              <Select disabled={disabled} {...register('networkType')}>
                <option>ОТ</option>
                <option>ГВС</option>
              </Select>
            </FormField>
            <FormField label="Тип повреждения">
              <Select disabled={disabled} {...register('damageType')}>
                <option>Текущее</option>
                <option>Гидравлическое</option>
              </Select>
            </FormField>
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
            <FormField label="Зеленая зона"><Input type="number" disabled={disabled} {...register('greenZoneArea', { valueAsNumber: true })} /></FormField>
            <FormField label="Асфальт"><Input type="number" disabled={disabled} {...register('asphaltArea', { valueAsNumber: true })} /></FormField>
            <FormField label="Бортовой камень"><Input type="number" disabled={disabled} {...register('curbCount', { valueAsNumber: true })} /></FormField>
            <FormField label="Проезжая часть"><Checkbox disabled={disabled} {...register('improvementMain')} /></FormField>
            <FormField label="Тротуар"><Checkbox disabled={disabled} {...register('improvementSidewalk')} /></FormField>
          </div>
        ),
      },
      {
        id: 'photo',
        label: 'Фото',
        content: (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={!canEditMain || uploadPhoto.isPending}
              onClick={() => photoInputRef.current?.click()}
            >
              {uploadPhoto.isPending ? 'Загрузка…' : 'Загрузить фото'}
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadPhoto.mutate(file);
                event.target.value = '';
              }}
            />
            <div className="photo-grid" style={{ marginTop: 12 }}>
              {damage.photos.map((photo) => (
                <a key={photo.id} className="photo-tile" href={photo.url} target="_blank" rel="noreferrer">
                  <img src={photo.url} alt={photo.fileName} />
                  <span>{photo.fileName}</span>
                </a>
              ))}
            </div>
          </>
        ),
      },
      { id: 'history', label: 'История', content: <AuditHistoryTable entityType="damage" entityId={damage.id} /> },
    ],
    [damage, disabled, register, canEditMain, uploadPhoto],
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
      <GisPointPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSave={({ latitude, longitude, address }) => {
          savePoint.mutate({ latitude, longitude }, { onSuccess: () => setPickerOpen(false) });
          if (address) setValue('address', address);
        }}
      />
      <DamageCardReportModal damage={damage} open={reportOpen} onClose={() => setReportOpen(false)} />
    </form>
  );
};
