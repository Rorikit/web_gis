import { Button, DatePicker, FormField, Input, Select } from '@/shared/ui';

export const GisSidebar = ({ archiveMode, onArchiveMode }: { archiveMode: boolean; onArchiveMode: (value: boolean) => void }) => (
  <aside className="gis-sidebar">
    <FormField label="Поиск адреса"><Input placeholder="Введите адрес" /></FormField>
    <FormField label="Район">
      <Select><option>Все районы</option><option>Центральный район</option><option>Северный район</option></Select>
    </FormField>
    <FormField label="Тип ордера"><Select><option>Все</option><option>Текущий</option><option>Гарантийный</option></Select></FormField>
    <FormField label="Статус"><Select><option>Все</option><option>В работе</option><option>Закрытый</option></Select></FormField>
    <FormField label="Период с"><DatePicker /></FormField>
    <FormField label="Период по"><DatePicker /></FormField>
    <FormField label="Исполнитель"><Input placeholder="Исполнитель" /></FormField>
    <Button variant={archiveMode ? 'primary' : 'secondary'} onClick={() => onArchiveMode(!archiveMode)}>Архив ордеров</Button>
    <div className="card">
      <h3 className="section-title">Легенда</h3>
      <p><span style={{ color: '#dc2626' }}>●</span> текущий</p>
      <p><span style={{ color: '#eab308' }}>●</span> гарантийный</p>
      <p><span style={{ color: '#64748b' }}>●</span> закрытый</p>
    </div>
  </aside>
);
