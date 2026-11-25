import type { PropsWithChildren } from 'react';
import { Input, PageToolbar } from '@/shared/ui';

type TableToolbarProps = PropsWithChildren<{
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}>;

export const TableToolbar = ({ search, onSearch, placeholder = 'Поиск по адресу или номеру', children }: TableToolbarProps) => (
  <PageToolbar>
    <Input
      value={search}
      onChange={(event) => onSearch(event.target.value)}
      placeholder={placeholder}
      style={{ width: 320 }}
    />
    {children}
  </PageToolbar>
);
