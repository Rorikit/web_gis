import { useState } from 'react';
import type { User } from '@/entities';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/features/permissions/model/permissions';
import { useDeleteUser, useUsers } from '@/features/users/hooks/useUsers';
import { CreateUserDrawer } from '@/features/users/ui/CreateUserDrawer';
import { UserDrawer } from '@/features/users/ui/UserDrawer';
import { UsersTable } from '@/features/users/ui/UsersTable';
import { Button, Modal, PageHeader } from '@/shared/ui';

export const UsersPage = () => {
  const query = useUsers();
  const { data: currentUser } = useCurrentUser();
  const remove = useDeleteUser();
  const [selected, setSelected] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, { onSettled: () => setDeleting(null) });
  };

  return (
    <>
      <PageHeader title="Пользователи" actions={<Button onClick={() => setCreating(true)}>Добавить пользователя</Button>} />
      <UsersTable
        data={query.data ?? []}
        currentUserId={currentUser?.id}
        canDelete={hasPermission(currentUser?.role, 'users.delete')}
        onEdit={setSelected}
        onDelete={setDeleting}
        isLoading={query.isLoading}
        isError={query.isError}
      />
      <UserDrawer user={selected} users={query.data ?? []} open={Boolean(selected)} onClose={() => setSelected(null)} />
      <CreateUserDrawer open={creating} onClose={() => setCreating(false)} />
      <Modal open={Boolean(deleting)} title="Удаление пользователя" onClose={() => setDeleting(null)}>
        <p style={{ marginTop: 0 }}>
          Удалить пользователя <strong>{deleting?.ldapLogin}</strong>{deleting?.fullName ? ` (${deleting.fullName})` : ''}?
          Действие необратимо; записи, которые он вносил, и история изменений сохранятся.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="danger" onClick={confirmDelete} disabled={remove.isPending}>
            {remove.isPending ? 'Удаление…' : 'Удалить'}
          </Button>
          <Button variant="secondary" onClick={() => setDeleting(null)}>Отмена</Button>
        </div>
      </Modal>
    </>
  );
};
