import type { Damage } from '@/entities';
import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { isRecord, shouldUseMockFallback, fallbackOrThrow } from './mock-fallback';
import { mockStore } from './mock-store';

export const damagesApi = {
  async list(params?: { archived?: boolean }): Promise<Damage[]> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.damages.list, { params });
      if (Array.isArray(data)) return data as Damage[];
      return fallbackOrThrow(
        'damages',
        'Backend returned invalid payload for GET /damages',
        () => mockStore.listDamages(Boolean(params?.archived)),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'damages')) throw error;
      return mockStore.listDamages(Boolean(params?.archived));
    }
  },
  async detail(id: string): Promise<Damage | null> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.damages.detail(id));
      if (isRecord(data) && typeof data.id === 'string') return data as Damage;
      return fallbackOrThrow(
        'damages',
        'Backend returned invalid payload for GET /damages/{id}',
        () => mockStore.getDamage(id),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'damages')) throw error;
      return mockStore.getDamage(id);
    }
  },
  async create(payload: Partial<Damage>): Promise<Damage> {
    try {
      const { data } = await httpClient.post<unknown>(endpoints.damages.list, payload);
      if (isRecord(data) && typeof data.id === 'string') return data as Damage;
      return fallbackOrThrow(
        'damages',
        'Backend returned invalid payload for POST /damages',
        () => mockStore.createDamage(payload),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'damages')) throw error;
      return mockStore.createDamage(payload);
    }
  },
  async update(id: string, payload: Partial<Damage>): Promise<Damage> {
    try {
      const { data } = await httpClient.put<unknown>(endpoints.damages.detail(id), payload);
      if (isRecord(data) && typeof data.id === 'string') return data as Damage;
      return fallbackOrThrow(
        'damages',
        'Backend returned invalid payload for PUT /damages/{id}',
        () => mockStore.updateDamage(id, payload),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'damages')) throw error;
      return mockStore.updateDamage(id, payload);
    }
  },
  async archive(id: string): Promise<Damage> {
    try {
      const { data } = await httpClient.post<unknown>(endpoints.damages.archive(id));
      if (isRecord(data) && typeof data.id === 'string') return data as Damage;
      return fallbackOrThrow(
        'damages',
        'Backend returned invalid payload for POST /damages/{id}/archive',
        () => mockStore.archiveDamage(id),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'damages')) throw error;
      return mockStore.archiveDamage(id);
    }
  },
};
