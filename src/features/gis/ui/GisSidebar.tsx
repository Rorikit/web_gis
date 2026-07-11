import { districts } from '@/shared/constants/districts';
import { Button, DatePicker, FormField, Input, Select } from '@/shared/ui';

export const GisSidebar = ({
  archiveMode,
  onArchiveMode,
  district,
  onDistrictChange,
}: {
  archiveMode: boolean;
  onArchiveMode: (value: boolean) => void;
  district: string;
  onDistrictChange: (value: string) => void;
}) => (
  <aside className="gis-sidebar">
    <FormField label="Поиск адреса"><Input placeholder="Введите адрес" /></FormField>
    <FormField label="Район">
      <Select value={district} onChange={(event) => onDistrictChange(event.target.value)}>
        <option value="">Все районы</option>
        {districts.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </Select>
    </FormField>
    <FormField label="Тип ордера">
      <Select>
        <option>Все</option>
        <option>Текущий</option>
        <option>Гарантийный</option>
      </Select>
    </FormField>
    <FormField label="Статус">
      <Select>
        <option>Все</option>
        <option>В работе</option>
        <option>Закрытый</option>
      </Select>
    </FormField>
    <FormField label="Период с"><DatePicker /></FormField>
    <FormField label="Период по"><DatePicker /></FormField>
    <FormField label="Исполнитель"><Input placeholder="Исполнитель" /></FormField>
    <Button variant={archiveMode ? 'primary' : 'secondary'} onClick={() => onArchiveMode(!archiveMode)}>Архив ордеров</Button>
  </aside>
);
