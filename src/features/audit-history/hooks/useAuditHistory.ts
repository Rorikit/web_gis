import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/shared/api/audit.api';
import { queryKeys } from '@/shared/types/query';

export const useAuditHistory = (entityType: string, entityId: string) =>
  useQuery({
    queryKey: queryKeys.audit(entityType, entityId),
    queryFn: () => auditApi.history(entityType, entityId),
    enabled: Boolean(entityType && entityId),
  });
