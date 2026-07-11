import { districts } from '@/shared/constants/districts';
import { Button, DatePicker, FormField, Input, Select } from '@/shared/ui';

export const GisSidebar = ({ archiveMode, onArchiveMode }: { archiveMode: boolean; onArchiveMode: (value: boolean) => void }) => (
  <aside className="gis-sidebar">
    <FormField label="Поиск адреса"><Input placeholder="Введите адрес" /></FormField>
    <FormField label="Район">
      <Select>
        <option>Все районы</option>
        {districts.map((district) => (
          <option key={district.id}>{district.name}</option>
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
