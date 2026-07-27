import { useState } from 'react';
import type { User } from '@/entities';
import { useUsers } from '@/features/users/hooks/useUsers';
import { CreateUserDrawer } from '@/features/users/ui/CreateUserDrawer';
import { UserDrawer } from '@/features/users/ui/UserDrawer';
import { UsersTable } from '@/features/users/ui/UsersTable';
import { Button, PageHeader } from '@/shared/ui';

export const UsersPage = () => {
  const query = useUsers();
  const [selected, setSelected] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  return (
    <>
      <PageHeader title="Пользователи" actions={<Button onClick={() => setCreating(true)}>Добавить пользователя</Button>} />
      <UsersTable data={query.data ?? []} onEdit={setSelected} isLoading={query.isLoading} isError={query.isError} />
      <UserDrawer user={selected} users={query.data ?? []} open={Boolean(selected)} onClose={() => setSelected(null)} />
      <CreateUserDrawer open={creating} onClose={() => setCreating(false)} />
    </>
  );
};
