import { useState } from 'react';
import type { User } from '@/entities';
import { useUsers } from '@/features/users/hooks/useUsers';
import { UserDrawer } from '@/features/users/ui/UserDrawer';
import { UsersTable } from '@/features/users/ui/UsersTable';
import { PageHeader } from '@/shared/ui';

export const UsersPage = () => {
  const query = useUsers();
  const [selected, setSelected] = useState<User | null>(null);
  return (
    <>
      <PageHeader title="Пользователи" />
      <UsersTable data={query.data ?? []} onEdit={setSelected} isLoading={query.isLoading} isError={query.isError} />
      <UserDrawer user={selected} users={query.data ?? []} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </>
  );
};
