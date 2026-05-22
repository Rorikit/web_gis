import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Order } from '@/entities';
import { ordersApi } from '@/shared/api/orders.api';
import { queryKeys } from '@/shared/types/query';
import { useToastStore } from '@/shared/store/toast-store';

export const useOrders = (archived = false) =>
  useQuery({ queryKey: queryKeys.orders(archived), queryFn: () => ordersApi.list({ archived }) });

export const useOrder = (id: string) =>
  useQuery({ queryKey: queryKeys.order(id), queryFn: () => ordersApi.detail(id), enabled: Boolean(id) });

export const useUpdateOrder = (id: string) => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: (payload: Partial<Order>) => ordersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
      push({ kind: 'success', title: 'Ордер сохранен' });
    },
    onError: () => push({ kind: 'error', title: 'Ошибка сохранения' }),
  });
};

export const useArchiveOrder = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: ordersApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      push({ kind: 'success', title: 'Ордер отправлен в архив' });
    },
  });
};
