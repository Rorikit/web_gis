import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { User, UserRole } from '@/entities';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { roleLabel } from '@/features/permissions/model/permissions';
import { useUpdateUser } from '@/features/users/hooks/useUsers';
import type { UpdateUserPayload } from '@/shared/api/users.api';
import { districts } from '@/shared/constants/districts';
import { Button, Checkbox, Drawer, FormField, Input, Select } from '@/shared/ui';
import { useToastStore } from '@/shared/store/toast-store';

type UserForm = Pick<User, 'ldapLogin' | 'fullName' | 'role' | 'isActive'> & {
  districtId: string;
  changePassword: boolean;
  password: string;
};

const toForm = (user: User): UserForm => ({
  ldapLogin: user.ldapLogin,
  fullName: user.fullName,
  role: user.role,
  districtId: user.districtId ?? '',
  isActive: user.isActive,
  changePassword: false,
  password: '',
});

export const UserDrawer = ({ user, open, onClose, users }: { user: User | null; open: boolean; onClose: () => void; users: User[] }) => {
  const { register, handleSubmit, reset, watch } = useForm<UserForm>();
  const update = useUpdateUser();
  const { data: currentUser } = useCurrentUser();
  const push = useToastStore((state) => state.push);
  const changePassword = watch('changePassword');

  useEffect(() => {
    if (user) reset(toForm(user));
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

    const payload: UpdateUserPayload = {
      ldapLogin: values.ldapLogin,
      fullName: values.fullName,
      role: values.role,
      districtId: values.districtId || null,
      isActive: values.isActive,
    };
    // Пустое поле при включенной галочке — это осознанно пустой пароль.
    if (values.changePassword) payload.password = values.password;

    update.mutate({ id: user.id, payload }, { onSuccess: onClose });
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
          <FormField label="Сменить пароль"><Checkbox {...register('changePassword')} /></FormField>
          {changePassword && (
            <FormField label="Новый пароль" hint="Допускается простой или пустой пароль. Пустое поле — вход без пароля.">
              <Input type="password" autoComplete="new-password" {...register('password')} />
            </FormField>
          )}
          <Button type="submit" disabled={update.isPending}>Сохранить</Button>
        </form>
      )}
    </Drawer>
  );
};
