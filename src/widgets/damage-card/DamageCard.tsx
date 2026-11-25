import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import type { Damage } from '@/entities';
import { AuditHistoryTable } from '@/features/audit-history/ui/AuditHistoryTable';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useOpenDamageOrder, useUpdateDamage, useUploadDamagePhoto } from '@/features/damages/hooks/useDamages';
import { useSaveDamagePoint } from '@/features/gis/hooks/useGis';
import { GisMiniPreview } from '@/features/gis/ui/GisMiniPreview';
import { GisPointPicker } from '@/features/gis/ui/GisPointPicker';
import { hasPermission } from '@/features/permissions/model/permissions';
import { DamageCardReportModal } from '@/features/reports/ui/DamageCardReportModal';
import { Button, FormField, Input, Select, Tabs, Textarea } from '@/shared/ui';

const schema = z.object({
  address: z.string(),
  networkType: z.enum(['ОТ', 'ГВС']),
  damageType: z.enum(['Текущее', 'Гидравлическое']),
  detectedAt: z.string(),
  fixedAt: z.string(),
  heatSource: z.string(),
  disconnectedAddresses: z.string(),
  damageDescription: z.string(),
  note: z.string(),
  orderNumber: z.string(),
  orderOpenedAt: z.string(),
  orderValidUntil: z.string(),
  orderClosedAt: z.string(),
});

type DamageForm = z.infer<typeof schema>;

const toFormValues = (damage: Damage): DamageForm => ({
  address: damage.address,
  networkType: damage.networkType,
  damageType: damage.damageType,
  detectedAt: damage.detectedAt,
  fixedAt: damage.fixedAt ?? '',
  heatSource: damage.heatSource,
  disconnectedAddresses: damage.disconnectedAddresses,
  damageDescription: damage.damageDescription,
  note: damage.note,
  orderNumber: damage.orderNumber,
  orderOpenedAt: damage.orderOpenedAt ?? '',
  orderValidUntil: damage.orderValidUntil ?? '',
  orderClosedAt: damage.orderClosedAt ?? '',
});

export const DamageCard = ({ damage }: { damage: Damage }) => {
  const [tab, setTab] = useState('main');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [orderNumberDraft, setOrderNumberDraft] = useState('');
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const { data: user } = useCurrentUser();
  const update = useUpdateDamage(damage.id);
  const savePoint = useSaveDamagePoint(damage.id);
  const uploadPhoto = useUploadDamagePhoto(damage.id);
  const openOrder = useOpenDamageOrder(damage.id);
  const canEditDamage = hasPermission(user?.role, 'damage.update');
  const canEditOrderFields = hasPermission(user?.role, 'damage.orderFields.update');
  const canBuildReport = hasPermission(user?.role, 'reports.createDamageCard');
  const { register, handleSubmit, reset } = useForm<DamageForm>({
    defaultValues: toFormValues(damage),
  });

  const disabled = !canEditDamage || update.isPending;
  const orderDisabled = !canEditOrderFields || update.isPending;
  // После заполнения номера ордера адрес правит только роль «Район: ордера».
  const addressLocked = Boolean(damage.orderNumber.trim()) && !canEditOrderFields;

  const onSubmit = (values: DamageForm) => {
    const result = schema.safeParse(values);
    if (!result.success) return;

    const { orderNumber, orderOpenedAt, orderValidUntil, orderClosedAt, ...mainFields } = result.data;
    const payload: Record<string, unknown> = {};

    if (canEditDamage) {
      Object.assign(payload, mainFields, { fixedAt: mainFields.fixedAt || null });
    }
    if (canEditOrderFields && damage.orderOpenedAt) {
      Object.assign(payload, {
        orderNumber,
        orderOpenedAt: orderOpenedAt || null,
        orderValidUntil: orderValidUntil || null,
        orderClosedAt: orderClosedAt || null,
      });
    }

    update.mutate(payload, { onSuccess: () => navigate('/damages') });
  };

  const tabs = useMemo(
    () => [
      {
        id: 'main',
        label: 'Основное',
        content: (
          <div className="form-grid">
            <FormField
              label="Адрес"
              hint={addressLocked ? 'После заполнения номера ордера адрес меняет только район: ордера' : undefined}
            >
              <Input disabled={disabled || addressLocked} {...register('address')} />
            </FormField>
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
            <FormField label="Дата обнаружения"><Input type="date" disabled={disabled} {...register('detectedAt')} /></FormField>
            <FormField label="Дата устранения" hint="После заполнения повреждение уходит в архив">
              <Input type="date" disabled={disabled} {...register('fixedAt')} />
            </FormField>
            <FormField label="Источник тепла"><Input disabled={disabled} {...register('heatSource')} /></FormField>
            <FormField label="Адреса отключенных абонентов"><Textarea disabled={disabled} {...register('disconnectedAddresses')} /></FormField>
            <FormField label="Характер повреждения"><Textarea disabled={disabled} {...register('damageDescription')} /></FormField>
            <FormField label="Примечание"><Textarea disabled={disabled} {...register('note')} /></FormField>
          </div>
        ),
      },
      {
        id: 'order',
        label: 'Ордер',
        content: damage.orderOpenedAt ? (
          <div className="form-grid">
            <FormField label="№ ордера"><Input disabled={orderDisabled} {...register('orderNumber')} /></FormField>
            <FormField label="Дата открытия ордера"><Input type="date" disabled={orderDisabled} {...register('orderOpenedAt')} /></FormField>
            <FormField label="Ордер действует до"><Input type="date" disabled={orderDisabled} {...register('orderValidUntil')} /></FormField>
            <FormField label="Дата закрытия ордера"><Input type="date" disabled={orderDisabled} {...register('orderClosedAt')} /></FormField>
            <div className="details-item" style={{ gridColumn: '1 / -1' }}>
              <span>Перейти к ордеру</span><Link to={`/orders/${damage.id}`}>Открыть карточку ордера</Link>
            </div>
            {!canEditOrderFields && (
              <div className="details-item" style={{ gridColumn: '1 / -1' }}>
                <span>Права</span>Поля ордера доступны только роли «Район: ордера»
              </div>
            )}
          </div>
        ) : (
          <div className="form-grid">
            <FormField label="№ ордера (можно заполнить позже)">
              <Input
                value={orderNumberDraft}
                disabled={orderDisabled}
                placeholder="Введите номер ордера"
                onChange={(event) => setOrderNumberDraft(event.target.value)}
              />
            </FormField>
            <div className="details-item" style={{ gridColumn: '1 / -1' }}>
              <span>Статус</span>Ордер не открыт — повреждение может существовать без ордера
            </div>
            {canEditOrderFields ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <Button
                  type="button"
                  disabled={openOrder.isPending}
                  onClick={() =>
                    openOrder.mutate(
                      { orderNumber: orderNumberDraft.trim() },
                      {
                        onSuccess: (updated) => {
                          reset(toFormValues(updated));
                          setOrderNumberDraft('');
                        },
                      },
                    )
                  }
                >
                  {openOrder.isPending ? 'Открытие…' : 'Открыть ордер'}
                </Button>
              </div>
            ) : (
              <div className="details-item" style={{ gridColumn: '1 / -1' }}>
                <span>Права</span>Открыть ордер может роль «Район: ордера»
              </div>
            )}
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
              disabled={!canEditDamage || uploadPhoto.isPending}
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
    [damage, disabled, orderDisabled, addressLocked, register, canEditDamage, canEditOrderFields, uploadPhoto, openOrder, orderNumberDraft, reset],
  );

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="section-title">Карточка повреждения</h2>
      <Tabs items={tabs} activeId={tab} onChange={setTab} />

      <section className="damage-gis-section">
        <div className="damage-gis-section__header">
          <h3 className="section-title">GIS</h3>
          <div className="damage-gis-section__actions">
            <Button type="button" variant="secondary" disabled={!canEditDamage} onClick={() => setPickerOpen(true)}>Указать точку</Button>
            <Button type="button" variant="secondary" disabled={!canEditDamage} onClick={() => setPickerOpen(true)}>Изменить</Button>
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
        {(canEditDamage || canEditOrderFields) && (
          <Button type="submit" disabled={update.isPending}>Сохранить</Button>
        )}
        <Button type="button" variant="secondary" onClick={() => reset()}>Отмена</Button>
        {canBuildReport && (
          <Button type="button" variant="secondary" onClick={() => setReportOpen(true)}>Карта повреждения DOCX</Button>
        )}
      </div>
      <GisPointPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSave={({ latitude, longitude }) => {
          savePoint.mutate({ latitude, longitude }, { onSuccess: () => setPickerOpen(false) });
        }}
      />
      <DamageCardReportModal damage={damage} open={reportOpen} onClose={() => setReportOpen(false)} />
    </form>
  );
};
