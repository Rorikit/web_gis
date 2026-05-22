import type { ColumnDef } from '@tanstack/react-table';
import type { AuditEvent } from '@/entities';
import { useAuditHistory } from '../hooks/useAuditHistory';
import { DataTable } from '@/shared/ui';

const columns: ColumnDef<AuditEvent>[] = [
  { header: 'Дата', accessorKey: 'createdAt', cell: ({ getValue }) => new Date(String(getValue())).toLocaleString('ru-RU') },
  { header: 'Пользователь', accessorKey: 'userName' },
  { header: 'Поле', accessorKey: 'fieldName' },
  { header: 'Было', accessorKey: 'oldValue' },
  { header: 'Стало', accessorKey: 'newValue' },
];

export const AuditHistoryTable = ({ entityType, entityId }: { entityType: string; entityId: string }) => {
  const { data = [], isLoading, isError } = useAuditHistory(entityType, entityId);
  return <DataTable data={data} columns={columns} isLoading={isLoading} isError={isError} emptyTitle="История изменений пуста" />;
};
