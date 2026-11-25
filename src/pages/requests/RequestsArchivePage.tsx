import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { RequestArchive } from '@/entities';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/features/permissions/model/permissions';
import { useCreateRequest, useDeleteRequest, useRequests } from '@/features/requests/hooks/useRequests';
import { Button, DataTable, FormField, Input, Modal, PageHeader, Textarea } from '@/shared/ui';

const columns = (canDelete: boolean, onDelete: (id: string) => void): ColumnDef<RequestArchive>[] => [
  { id: 'rowNumber', header: '№ п/п', cell: ({ row }) => row.index + 1, size: 70 },
  { header: 'Дата заявки', accessorKey: 'requestDate' },
  { header: 'Подрядчик', accessorKey: 'contractor' },
  { header: 'Список адресов', accessorKey: 'addresses', cell: ({ getValue }) => String(getValue() || '-') },
  {
    header: 'Файл (скан заявки)',
    cell: ({ row }) => (row.original.fileUrl
      ? <a href={row.original.fileUrl} target="_blank" rel="noreferrer">{row.original.fileName || 'Открыть файл'}</a>
      : '-'),
  },
  {
    header: 'Действия',
    cell: ({ row }) => (
      <Button variant="danger" disabled={!canDelete} onClick={() => onDelete(row.original.id)}>Удалить</Button>
    ),
  },
];

export const RequestsArchivePage = () => {
  const [open, setOpen] = useState(false);
  const [requestDate, setRequestDate] = useState('');
  const [contractor, setContractor] = useState('');
  const [addresses, setAddresses] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { data: user } = useCurrentUser();
  const query = useRequests();
  const create = useCreateRequest();
  const remove = useDeleteRequest();
  const canCreate = hasPermission(user?.role, 'requests.create');
  const canDelete = hasPermission(user?.role, 'requests.delete');

  const resetForm = () => {
    setRequestDate('');
    setContractor('');
    setAddresses('');
    setFile(null);
  };

  const submit = () => {
    create.mutate(
      { requestDate, contractor, addresses, file },
      {
        onSuccess: () => {
          resetForm();
          setOpen(false);
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Архив заявок"
        subtitle="Сканы рукописных заявок на восстановление благоустройства"
        actions={canCreate ? <Button onClick={() => setOpen(true)}>Добавить заявку</Button> : undefined}
      />
      <DataTable
        data={query.data ?? []}
        columns={columns(canDelete, (id) => remove.mutate(id))}
        isLoading={query.isLoading}
        isError={query.isError}
        emptyTitle="Заявки не найдены"
      />
      <Modal open={open} title="Новая заявка" onClose={() => setOpen(false)}>
        <div className="form-grid">
          <FormField label="Дата заявки">
            <Input type="date" value={requestDate} onChange={(event) => setRequestDate(event.target.value)} />
          </FormField>
          <FormField label="Подрядчик">
            <Input maxLength={512} value={contractor} onChange={(event) => setContractor(event.target.value)} />
          </FormField>
          <FormField label="Список адресов">
            <Textarea value={addresses} onChange={(event) => setAddresses(event.target.value)} />
          </FormField>
          <FormField label="Файл (скан рукописной заявки)">
            <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </FormField>
        </div>
        <div style={{ marginTop: 16 }}>
          <Button onClick={submit} disabled={create.isPending || !requestDate}>
            {create.isPending ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </Modal>
    </>
  );
};
