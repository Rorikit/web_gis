import type { AuditEvent } from '@/entities';
import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { shouldUseMockFallback, fallbackOrThrow } from './mock-fallback';
import { mockStore } from './mock-store';

export const auditApi = {
  async history(entityType: string, entityId: string): Promise<AuditEvent[]> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.audit.history(entityType, entityId));
      if (Array.isArray(data)) return data as AuditEvent[];
      return fallbackOrThrow(
        'audit',
        'Backend returned invalid payload for GET /audit/{entityType}/{entityId}',
        () => mockStore.audit(entityType, entityId),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'audit')) throw error;
      return mockStore.audit(entityType, entityId);
    }
  },
};
