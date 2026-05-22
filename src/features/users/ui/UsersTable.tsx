import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@/entities';
import { roleLabel } from '@/features/permissions/model/permissions';
import { districts } from '@/shared/constants/districts';
import { Badge, Button, DataTable } from '@/shared/ui';

export const UsersTable = ({ data, onEdit, isLoading, isError }: { data: User[]; onEdit: (user: User) => void; isLoading?: boolean; isError?: boolean }) => {
  const columns: ColumnDef<User>[] = [
    { header: 'LDAP', accessorKey: 'ldapLogin' },
    { header: 'ФИО', accessorKey: 'fullName' },
    { header: 'Роль', cell: ({ row }) => roleLabel[row.original.role] },
    { header: 'Район', cell: ({ row }) => districts.find((item) => item.id === row.original.districtId)?.name ?? 'Все районы' },
    { header: 'Статус', cell: ({ row }) => row.original.isActive ? <Badge tone="success">Активен</Badge> : <Badge tone="danger">Заблокирован</Badge> },
    { header: 'Последний вход', accessorKey: 'lastLoginAt', cell: ({ getValue }) => getValue() ? new Date(String(getValue())).toLocaleString('ru-RU') : '-' },
    { header: 'Редактировать', cell: ({ row }) => <Button variant="secondary" onClick={() => onEdit(row.original)}>Открыть</Button> },
  ];
  return <DataTable data={data} columns={columns} isLoading={isLoading} isError={isError} emptyTitle="Пользователи не найдены" />;
};
