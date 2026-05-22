import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GisPoint } from '@/entities';
import { gisApi } from '@/shared/api/gis.api';
import { queryKeys } from '@/shared/types/query';
import { useToastStore } from '@/shared/store/toast-store';

export const useGisOpenOrders = () =>
  useQuery({ queryKey: queryKeys.gisOpenOrders, queryFn: gisApi.openOrders });

export const useGisArchivedOrders = (from?: string, to?: string) =>
  useQuery({ queryKey: queryKeys.gisArchivedOrders(from, to), queryFn: () => gisApi.archivedOrders({ from, to }) });

export const useSaveDamagePoint = (damageId: string) => {
  const queryClient = useQueryClient();
  const push = useToastStore((state) => state.push);
  return useMutation({
    mutationFn: (point: Pick<GisPoint, 'latitude' | 'longitude'>) => gisApi.saveDamagePoint(damageId, point),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.damage(damageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.audit('damage', damageId) });
      push({ kind: 'success', title: 'GIS-точка сохранена' });
    },
    onError: () => push({ kind: 'error', title: 'Ошибка GIS API' }),
  });
};
