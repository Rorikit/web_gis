import type { AuditEvent } from '@/entities';
import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { shouldUseMockFallback } from './mock-fallback';
import { mockStore } from './mock-store';

export const auditApi = {
  async history(entityType: string, entityId: string): Promise<AuditEvent[]> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.audit.history(entityType, entityId));
      return Array.isArray(data) ? (data as AuditEvent[]) : mockStore.audit(entityType, entityId);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.audit(entityType, entityId);
    }
  },
};
