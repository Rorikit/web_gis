import { useState } from 'react';
import type { Damage } from '@/entities';
import { reportsApi } from '@/shared/api/reports.api';
import { downloadBlob } from '@/shared/lib/download';
import { Button, FormField, Input, Modal, Textarea } from '@/shared/ui';
import { useToastStore } from '@/shared/store/toast-store';

type FieldSpec = {
  name: string;
  label: string;
  type?: 'text' | 'date' | 'time' | 'number' | 'textarea';
  hint?: string;
};

// Приложение №2: п.1-4 подставляются из базы, п.15 — графическая схема,
// остальные пункты пользователь заполняет здесь перед выводом отчёта.
const sections: { title: string; fields: FieldSpec[] }[] = [
  {
    title: 'Заявка',
    fields: [
      { name: 'requestNumber', label: 'Заявка №' },
      { name: 'requestDate', label: 'Дата заявки', type: 'date' },
    ],
  },
  {
    title: 'Участок повреждения',
    fields: [
      { name: 'startChamber', label: '5. Начальная камера (точка) участка' },
      { name: 'endChamber', label: '6. Конечная камера (точка) участка' },
      { name: 'distanceFromChamber', label: '7. Расстояние от начальной камеры, м', type: 'number' },
      {
        name: 'layingType',
        label: '8. Тип прокладки тр-да',
        hint: '0 - камера; 1 - непроходной канал; 2 - полупроходной канал; 3 - в гильзе; 4 - по подвалу; 5 - надземная; 6 - в пределах ЦТП',
      },
      { name: 'drainedPipe', label: '9. Дренируемый тр-д', hint: '1 - подающий; 2 - обратный; 3 - оба тр-да' },
      { name: 'damagedPipe', label: '10. Поврежденный тр-д', hint: '1 - подающий; 2 - обратный' },
      { name: 'outerDiameter', label: '11. Наружный диаметр, мм', type: 'number' },
      { name: 'mode', label: '12. Режим', hint: '1 - эксплуатация; 2 - опрессовка; 3 - др. испытания' },
    ],
  },
  {
    title: 'Повреждение',
    fields: [
      {
        name: 'damagedElement',
        label: '13. Поврежденный элемент трубопровода',
        hint: '1 - прямой уч-к; 2 - прямой уч-к в стене или Н.О.; 3 - прямой уч-к в скользящей опоре; 4 - отвод; 5 - байпас; 6 - переход; 7 - сварной стык; 8 - задвижка; 9 - СК; 10 - СКУ; 11 - дренаж; 12 - воздушник; 13 - клапан',
      },
      {
        name: 'damageNature',
        label: '14. Характер повреждения',
        hint: '1 - разрыв; 2 - свищ; 3 - разгерметизация СК; 4 - механическая деформация трубы; 5 - дефект задвижки',
      },
      { name: 'damageSizeA', label: '16. Размер повреждения, мм (A)', type: 'number' },
      { name: 'damageSizeB', label: '16. Размер повреждения, мм (B)', type: 'number' },
      { name: 'damageArea', label: '16. Площадь повреждения, кв.мм', type: 'number' },
      {
        name: 'damageReason',
        label: '17. Причины повреждения',
        hint: '1 - наружная коррозия; 2 - внутренняя коррозия; 3 - электрокоррозия; 4 - дефект металла; 5 - превышение допуст. давления, гидроудар; 6 - дефект сварки; 7 - износ металла',
      },
      { name: 'responsiblePerson', label: '18. Ответственный за устранение (Ф.И.О., должность)' },
    ],
  },
  {
    title: 'Описание ремонтных работ',
    fields: [
      {
        name: 'pipeRepair',
        label: '19. Ремонт тр-да и элементов',
        hint: '1 - поставлена заплата; 2 - заменен уч-к трубы; 3 - заварен свищ; 4 - поставлен хомут; 5 - уч-к отглушен; 6 - заменен элемент; 7 - элемент демонтирован; 8 - набит сальник; 9 - прочее; 10 - ремонт элемента',
      },
      { name: 'replacedLength', label: '20. Длина замененного уч-ка, м', type: 'number' },
      {
        name: 'insulationRepair',
        label: '21. Ремонт изоляционной конструкции тр-да',
        hint: '1 - восстановлена полностью; 2 - только противокоррозионная покраска; 3 - работы не проводились',
      },
      {
        name: 'channelRepair',
        label: '22. Ремонт канала',
        hint: '1 - восстановлен старыми элементами; 2 - плиты перекрытия заменены на новые; 3 - конструкции канала заменены полностью',
      },
      { name: 'shutdownDate', label: '23. Отключено с (дата)', type: 'date' },
      { name: 'shutdownTime', label: '23. Отключено с (время)', type: 'time' },
      { name: 'restoreDate', label: '24. Включено в работу (дата)', type: 'date' },
      { name: 'restoreTime', label: '24. Включено в работу (время)', type: 'time' },
      {
        name: 'channelState',
        label: '25. Состояние конструкций канала (камеры)',
        hint: '1 - конструкции целые; 2 - протекают швы; 3 - разрушено перекрытие; 4 - разрушены стенки; 5 - разрушены металлоконструкции',
      },
      {
        name: 'relatedReasons',
        label: '26. Сопутствующие причины',
        hint: '1 - подтопление грунтовыми или дренажными водами; 2 - канал заилен; 3 - капёж воды на тр-д; 4 - коррозионные факторы в сетевой воде; 5 - наружная коррозия в месте утечки; 6 - блуждающие токи. До 3-х кодов по убыванию влияния',
      },
      { name: 'notes', label: 'Примечания. Схемы. Пояснения', type: 'textarea' },
    ],
  },
  {
    title: 'Карту заполнил',
    fields: [
      { name: 'filledByPosition', label: 'Должность' },
      { name: 'filledByName', label: 'Ф.И.О.' },
      { name: 'filledAt', label: 'Дата', type: 'date' },
    ],
  },
];

export const DamageCardReportModal = ({ damage, open, onClose }: { damage: Damage; open: boolean; onClose: () => void }) => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const push = useToastStore((state) => state.push);

  const setField = (name: string, value: string) => setFields((prev) => ({ ...prev, [name]: value }));

  const submit = async () => {
    try {
      setLoading(true);
      const blob = await reportsApi.createDamageCard({ damageId: damage.id, fields });
      downloadBlob(blob, `Карта-повреждения-${damage.id}.docx`);
      push({ kind: 'success', title: 'Карта повреждения сформирована' });
      onClose();
    } catch {
      push({ kind: 'error', title: 'Ошибка выгрузки файла' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Карта повреждения DOCX" onClose={onClose}>
      <p style={{ marginTop: 0, color: 'var(--color-muted)', fontSize: 13 }}>
        Пункты 1-4 отчета заполняются из карточки повреждения. Остальные пункты формы заполните ниже —
        пустые поля останутся в отчете пустой строкой для заполнения от руки.
      </p>

      {sections.map((section) => (
        <section key={section.title} style={{ marginBottom: 16 }}>
          <h3 className="section-title" style={{ fontSize: 14 }}>{section.title}</h3>
          <div className="form-grid">
            {section.fields.map((field) => (
              <FormField key={field.name} label={field.label} hint={field.hint}>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={fields[field.name] ?? ''}
                    onChange={(event) => setField(field.name, event.target.value)}
                  />
                ) : (
                  <Input
                    type={field.type ?? 'text'}
                    value={fields[field.name] ?? ''}
                    onChange={(event) => setField(field.name, event.target.value)}
                  />
                )}
              </FormField>
            ))}
          </div>
        </section>
      ))}

      <div style={{ marginTop: 16 }}>
        <Button type="button" onClick={submit} disabled={loading}>
          {loading ? 'Формирование…' : 'Сформировать DOCX'}
        </Button>
      </div>
    </Modal>
  );
};
