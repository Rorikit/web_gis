import type { Order } from '@/entities';
import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { isRecord, shouldUseMockFallback } from './mock-fallback';
import { mockStore } from './mock-store';

export const ordersApi = {
  async list(params?: { archived?: boolean }): Promise<Order[]> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.orders.list, { params });
      return Array.isArray(data) ? (data as Order[]) : mockStore.listOrders(Boolean(params?.archived));
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.listOrders(Boolean(params?.archived));
    }
  },
  async detail(id: string): Promise<Order | null> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.orders.detail(id));
      return isRecord(data) && typeof data.id === 'string' ? (data as Order) : mockStore.getOrder(id);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.getOrder(id);
    }
  },
  async update(id: string, payload: Partial<Order>): Promise<Order> {
    try {
      const { data } = await httpClient.put<unknown>(endpoints.orders.detail(id), payload);
      return isRecord(data) && typeof data.id === 'string' ? (data as Order) : mockStore.updateOrder(id, payload);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.updateOrder(id, payload);
    }
  },
  async archive(id: string): Promise<Order> {
    try {
      const { data } = await httpClient.post<unknown>(endpoints.orders.archive(id));
      return isRecord(data) && typeof data.id === 'string' ? (data as Order) : mockStore.archiveOrder(id);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.archiveOrder(id);
    }
  },
};
