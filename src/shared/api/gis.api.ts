import type { Damage, GisPoint, Order } from '@/entities';
import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { isRecord, shouldUseMockFallback } from './mock-fallback';
import { mockStore } from './mock-store';

export const gisApi = {
  async openOrders(): Promise<Order[]> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.gis.openOrders);
      return Array.isArray(data) ? (data as Order[]) : mockStore.listOrders(false);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.listOrders(false);
    }
  },
  async archivedOrders(params?: { from?: string; to?: string }): Promise<Order[]> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.gis.archivedOrders, { params });
      return Array.isArray(data) ? (data as Order[]) : mockStore.listOrders(true);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.listOrders(true);
    }
  },
  async saveDamagePoint(damageId: string, point: Pick<GisPoint, 'latitude' | 'longitude'>): Promise<Damage> {
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
      throw new Error('Некорректные координаты GIS-точки');
    }
    try {
      const { data } = await httpClient.post<unknown>(endpoints.gis.createDamagePoint(damageId), point);
      return isRecord(data) && typeof data.id === 'string' ? (data as Damage) : mockStore.saveDamagePoint(damageId, point);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.saveDamagePoint(damageId, point);
    }
  },
  async updateDamagePoint(damageId: string, point: Pick<GisPoint, 'latitude' | 'longitude'>): Promise<Damage> {
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
      throw new Error('Некорректные координаты GIS-точки');
    }
    try {
      const { data } = await httpClient.put<unknown>(endpoints.gis.updateDamagePoint(damageId), point);
      return isRecord(data) && typeof data.id === 'string' ? (data as Damage) : mockStore.saveDamagePoint(damageId, point);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.saveDamagePoint(damageId, point);
    }
  },
};
