import type { Damage } from '@/entities';
import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { isRecord, shouldUseMockFallback } from './mock-fallback';
import { mockStore } from './mock-store';

export const damagesApi = {
  async list(params?: { archived?: boolean }): Promise<Damage[]> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.damages.list, { params });
      return Array.isArray(data) ? (data as Damage[]) : mockStore.listDamages(Boolean(params?.archived));
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.listDamages(Boolean(params?.archived));
    }
  },
  async detail(id: string): Promise<Damage | null> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.damages.detail(id));
      return isRecord(data) && typeof data.id === 'string' ? (data as Damage) : mockStore.getDamage(id);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.getDamage(id);
    }
  },
  async create(payload: Partial<Damage>): Promise<Damage> {
    try {
      const { data } = await httpClient.post<unknown>(endpoints.damages.list, payload);
      return isRecord(data) && typeof data.id === 'string' ? (data as Damage) : mockStore.createDamage(payload);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.createDamage(payload);
    }
  },
  async update(id: string, payload: Partial<Damage>): Promise<Damage> {
    try {
      const { data } = await httpClient.put<unknown>(endpoints.damages.detail(id), payload);
      return isRecord(data) && typeof data.id === 'string' ? (data as Damage) : mockStore.updateDamage(id, payload);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.updateDamage(id, payload);
    }
  },
  async archive(id: string): Promise<Damage> {
    try {
      const { data } = await httpClient.post<unknown>(endpoints.damages.archive(id));
      return isRecord(data) && typeof data.id === 'string' ? (data as Damage) : mockStore.archiveDamage(id);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.archiveDamage(id);
    }
  },
};
