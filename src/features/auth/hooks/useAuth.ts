import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginPayload } from '@/shared/api/auth.api';
import { queryKeys } from '@/shared/types/query';
import { useToastStore } from '@/shared/store/toast-store';

export const useCurrentUser = () =>
  useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: authApi.me,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const push = useToastStore((state) => state.push);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.currentUser, user);
      push({ kind: 'success', title: 'Вход выполнен' });
      navigate('/dashboard');
    },
    onError: () => push({ kind: 'error', title: 'Ошибка LDAP', message: 'Проверьте логин и пароль' }),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.currentUser, null);
      navigate('/auth');
    },
  });
};
