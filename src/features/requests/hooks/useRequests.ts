import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestsApi, type CreateRequestArchivePayload } from '@/shared/api/requests.api';
import { useToastStore } from '@/shared/store/toast-store';

export const useRequests = () =>
  useQuery({ queryKey: ['requests'], queryFn: requestsApi.list });

export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: (payload: CreateRequestArchivePayload) => requestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      push({ kind: 'success', title: 'Заявка добавлена' });
    },
    onError: () => push({ kind: 'error', title: 'Ошибка сохранения заявки' }),
  });
};

export const useDeleteRequest = () => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: (id: string) => requestsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      push({ kind: 'success', title: 'Заявка удалена' });
    },
    onError: () => push({ kind: 'error', title: 'Ошибка удаления заявки' }),
  });
};
