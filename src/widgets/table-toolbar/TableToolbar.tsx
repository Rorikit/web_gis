import { Input, PageToolbar, Select } from '@/shared/ui';

export const TableToolbar = ({ search, onSearch }: { search: string; onSearch: (value: string) => void }) => (
  <PageToolbar>
    <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Поиск по адресу или номеру" style={{ width: 320 }} />
    <Select style={{ width: 180 }} defaultValue="">
      <option value="">Все районы</option>
      <option value="central">Центральный район</option>
      <option value="north">Северный район</option>
      <option value="south">Южный район</option>
    </Select>
  </PageToolbar>
);
