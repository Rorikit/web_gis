import { districts } from '@/shared/constants/districts';
import { Button, DatePicker, FormField, Input, Select } from '@/shared/ui';

export type OrderMapFilters = {
  addressSearch: string;
  district: string;
  orderKind: string;
  status: string;
  periodFrom: string;
  periodTo: string;
  contractor: string;
};

export const GisSidebar = ({
  archiveMode,
  onArchiveMode,
  filters,
  onFiltersChange,
}: {
  archiveMode: boolean;
  onArchiveMode: (value: boolean) => void;
  filters: OrderMapFilters;
  onFiltersChange: (patch: Partial<OrderMapFilters>) => void;
}) => (
  <aside className="gis-sidebar">
    <FormField label="Поиск адреса">
      <Input placeholder="Введите адрес" value={filters.addressSearch} onChange={(event) => onFiltersChange({ addressSearch: event.target.value })} />
    </FormField>
    <FormField label="Район">
      <Select value={filters.district} onChange={(event) => onFiltersChange({ district: event.target.value })}>
        <option value="">Все районы</option>
        {districts.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </Select>
    </FormField>
    <FormField label="Тип ордера">
      <Select value={filters.orderKind} onChange={(event) => onFiltersChange({ orderKind: event.target.value })}>
        <option value="">Все</option>
        <option value="Текущий">Текущий</option>
        <option value="Гарантийный">Гарантийный</option>
      </Select>
    </FormField>
    <FormField label="Статус">
      <Select value={filters.status} onChange={(event) => onFiltersChange({ status: event.target.value })}>
        <option value="">Все</option>
        <option value="open">В работе</option>
        <option value="closed">Закрытый</option>
      </Select>
    </FormField>
    <FormField label="Период с">
      <DatePicker value={filters.periodFrom} onChange={(event) => onFiltersChange({ periodFrom: event.target.value })} />
    </FormField>
    <FormField label="Период по">
      <DatePicker value={filters.periodTo} onChange={(event) => onFiltersChange({ periodTo: event.target.value })} />
    </FormField>
    <FormField label="Исполнитель">
      <Input placeholder="Исполнитель" value={filters.contractor} onChange={(event) => onFiltersChange({ contractor: event.target.value })} />
    </FormField>
    <Button variant={archiveMode ? 'primary' : 'secondary'} onClick={() => onArchiveMode(!archiveMode)}>Архив ордеров</Button>
  </aside>
);
