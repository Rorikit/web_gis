import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { User, UserRole } from '@/entities';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { roleLabel } from '@/features/permissions/model/permissions';
import { useUpdateUser } from '@/features/users/hooks/useUsers';
import { districts } from '@/shared/constants/districts';
import { Button, Checkbox, Drawer, FormField, Input, Select } from '@/shared/ui';
import { useToastStore } from '@/shared/store/toast-store';

type UserForm = Pick<User, 'ldapLogin' | 'fullName' | 'role' | 'districtId' | 'isActive'>;

export const UserDrawer = ({ user, open, onClose, users }: { user: User | null; open: boolean; onClose: () => void; users: User[] }) => {
  const { register, handleSubmit, reset } = useForm<UserForm>();
  const update = useUpdateUser();
  const { data: currentUser } = useCurrentUser();
  const push = useToastStore((state) => state.push);

  useEffect(() => {
    if (user) reset(user);
  }, [user, reset]);

  const submit = (values: UserForm) => {
    if (!user) return;
    if (user.id === currentUser?.id && values.isActive === false) {
      push({ kind: 'error', title: 'Нельзя заблокировать самого себя' });
      return;
    }
    const admins = users.filter((item) => item.role === 'admin' && item.isActive);
    if (user.role === 'admin' && values.role !== 'admin' && admins.length <= 1) {
      push({ kind: 'error', title: 'Нельзя снять права последнего администратора' });
      return;
    }
    update.mutate({ id: user.id, payload: values }, { onSuccess: onClose });
  };

  return (
    <Drawer open={open} title="Карточка пользователя" onClose={onClose}>
      {user && (
        <form onSubmit={handleSubmit(submit)} style={{ padding: 16, display: 'grid', gap: 12 }}>
          <FormField label="LDAP login"><Input {...register('ldapLogin')} /></FormField>
          <FormField label="ФИО"><Input {...register('fullName')} /></FormField>
          <FormField label="Роль">
            <Select {...register('role')}>
              {(['district_damage', 'district_order', 'oopppr', 'full_access', 'admin'] as UserRole[]).map((role) => <option key={role} value={role}>{roleLabel[role]}</option>)}
            </Select>
          </FormField>
          <FormField label="Район">
            <Select {...register('districtId')}>
              <option value="">Все районы</option>
              {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Активен"><Checkbox {...register('isActive')} /></FormField>
          <Button type="submit" disabled={update.isPending}>Сохранить</Button>
        </form>
      )}
    </Drawer>
  );
};
