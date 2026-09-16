import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorDetail } from '@/shared/api/error-detail';
import type { CreateUserPayload, UpdateUserPayload } from '@/shared/api/users.api';
import { usersApi } from '@/shared/api/users.api';
import { queryKeys } from '@/shared/types/query';
import { useToastStore } from '@/shared/store/toast-store';

export const useUsers = () => useQuery({ queryKey: queryKeys.users, queryFn: usersApi.list });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      push({ kind: 'success', title: 'Пользователь создан' });
    },
    onError: (error) => push({ kind: 'error', title: 'Ошибка создания пользователя', message: errorDetail(error, '') }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      push({ kind: 'success', title: 'Пользователь сохранен' });
    },
    onError: (error) => push({ kind: 'error', title: 'Ошибка сохранения пользователя', message: errorDetail(error, '') }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      push({ kind: 'success', title: 'Пользователь удален' });
    },
    onError: (error) => push({ kind: 'error', title: 'Ошибка удаления пользователя', message: errorDetail(error, '') }),
  });
};
