import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Damage } from '@/entities';
import { damagesApi } from '@/shared/api/damages.api';
import { queryKeys } from '@/shared/types/query';
import { useToastStore } from '@/shared/store/toast-store';

export const useDamages = (archived = false) =>
  useQuery({ queryKey: queryKeys.damages(archived), queryFn: () => damagesApi.list({ archived }) });

export const useDamage = (id: string) =>
  useQuery({ queryKey: queryKeys.damage(id), queryFn: () => damagesApi.detail(id), enabled: Boolean(id) });

export const useCreateDamage = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: (payload: Partial<Damage>) => damagesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      push({ kind: 'success', title: 'Повреждение создано' });
    },
    onError: () => push({ kind: 'error', title: 'Ошибка сохранения' }),
  });
};

export const useUpdateDamage = (id: string) => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: (payload: Partial<Damage>) => damagesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.damage(id) });
      push({ kind: 'success', title: 'Повреждение сохранено' });
    },
    onError: () => push({ kind: 'error', title: 'Ошибка сохранения' }),
  });
};

export const useArchiveDamage = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: damagesApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damages'] });
      push({ kind: 'success', title: 'Повреждение отправлено в архив' });
    },
  });
};
