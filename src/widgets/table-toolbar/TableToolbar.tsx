import { districts } from '@/shared/constants/districts';
import { Input, PageToolbar, Select } from '@/shared/ui';

export const TableToolbar = ({ search, onSearch }: { search: string; onSearch: (value: string) => void }) => (
  <PageToolbar>
    <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Поиск по адресу или номеру" style={{ width: 320 }} />
    <Select style={{ width: 180 }} defaultValue="">
      <option value="">Все районы</option>
      {districts.map((district) => (
        <option key={district.id} value={district.id}>{district.name}</option>
      ))}
    </Select>
  </PageToolbar>
);
