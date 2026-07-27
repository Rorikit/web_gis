import { useForm } from 'react-hook-form';
import type { UserRole } from '@/entities';
import { roleLabel } from '@/features/permissions/model/permissions';
import { useCreateUser } from '@/features/users/hooks/useUsers';
import { districts } from '@/shared/constants/districts';
import { Button, Checkbox, Drawer, FormField, Input, Select } from '@/shared/ui';

type CreateUserForm = {
  ldapLogin: string;
  password: string;
  fullName: string;
  role: UserRole;
  districtId: string;
  isActive: boolean;
};

const defaultValues: CreateUserForm = {
  ldapLogin: '',
  password: '',
  fullName: '',
  role: 'district_damage',
  districtId: '',
  isActive: true,
};

export const CreateUserDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { register, handleSubmit, reset } = useForm<CreateUserForm>({ defaultValues });
  const create = useCreateUser();

  const submit = (values: CreateUserForm) => {
    create.mutate(
      {
        ldapLogin: values.ldapLogin,
        password: values.password,
        fullName: values.fullName,
        role: values.role,
        districtId: values.districtId || null,
        isActive: values.isActive,
      },
      {
        onSuccess: () => {
          reset(defaultValues);
          onClose();
        },
      },
    );
  };

  return (
    <Drawer open={open} title="Новый пользователь" onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} style={{ padding: 16, display: 'grid', gap: 12 }}>
        <FormField label="LDAP login"><Input {...register('ldapLogin', { required: true })} /></FormField>
        <FormField label="Пароль"><Input type="password" {...register('password', { required: true })} /></FormField>
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
        <FormField label="Активен"><Checkbox defaultChecked {...register('isActive')} /></FormField>
        <Button type="submit" disabled={create.isPending}>Создать</Button>
      </form>
    </Drawer>
  );
};
