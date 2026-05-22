import { useForm } from 'react-hook-form';
import { useLogin } from '@/features/auth/hooks/useAuth';
import { Button, FormField, Input } from '@/shared/ui';

type LoginForm = {
  ldapLogin: string;
  password: string;
};

export const AuthPage = () => {
  const login = useLogin();
  const { register, handleSubmit } = useForm<LoginForm>({ defaultValues: { ldapLogin: 'admin', password: '' } });

  return (
    <form className="auth-card" onSubmit={handleSubmit((values) => login.mutate(values))}>
      <h1>Вход</h1>
      <p>Авторизация через LDAP</p>
      <div style={{ display: 'grid', gap: 12 }}>
        <FormField label="LDAP логин"><Input {...register('ldapLogin', { required: true })} /></FormField>
        <FormField label="Пароль"><Input type="password" {...register('password', { required: true })} /></FormField>
        {login.isError && <div className="state state--error" style={{ minHeight: 40 }}>Ошибка LDAP, нет роли или пользователь заблокирован</div>}
        <Button disabled={login.isPending}>Войти</Button>
      </div>
    </form>
  );
};
