import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/entities';
import { usersApi } from '@/shared/api/users.api';
import { queryKeys } from '@/shared/types/query';
import { useToastStore } from '@/shared/store/toast-store';

export const useUsers = () => useQuery({ queryKey: queryKeys.users, queryFn: usersApi.list });

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<User> }) => usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      push({ kind: 'success', title: 'Пользователь сохранен' });
    },
    onError: () => push({ kind: 'error', title: 'Ошибка сохранения пользователя' }),
  });
};
