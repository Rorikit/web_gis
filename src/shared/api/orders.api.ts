import type { Order } from '@/entities';
import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { isRecord, shouldUseMockFallback, fallbackOrThrow } from './mock-fallback';
import { mockStore } from './mock-store';

export const ordersApi = {
  async list(params?: { archived?: boolean }): Promise<Order[]> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.orders.list, { params });
      if (Array.isArray(data)) return data as Order[];
      return fallbackOrThrow(
        'orders',
        'Backend returned invalid payload for GET /orders',
        () => mockStore.listOrders(Boolean(params?.archived)),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'orders')) throw error;
      return mockStore.listOrders(Boolean(params?.archived));
    }
  },
  async detail(id: string): Promise<Order | null> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.orders.detail(id));
      if (isRecord(data) && typeof data.id === 'string') return data as Order;
      return fallbackOrThrow(
        'orders',
        'Backend returned invalid payload for GET /orders/{id}',
        () => mockStore.getOrder(id),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'orders')) throw error;
      return mockStore.getOrder(id);
    }
  },
  async update(id: string, payload: Partial<Order>): Promise<Order> {
    try {
      const { data } = await httpClient.put<unknown>(endpoints.orders.detail(id), payload);
      if (isRecord(data) && typeof data.id === 'string') return data as Order;
      return fallbackOrThrow(
        'orders',
        'Backend returned invalid payload for PUT /orders/{id}',
        () => mockStore.updateOrder(id, payload),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'orders')) throw error;
      return mockStore.updateOrder(id, payload);
    }
  },
  async archive(id: string): Promise<Order> {
    try {
      const { data } = await httpClient.post<unknown>(endpoints.orders.archive(id));
      if (isRecord(data) && typeof data.id === 'string') return data as Order;
      return fallbackOrThrow(
        'orders',
        'Backend returned invalid payload for POST /orders/{id}/archive',
        () => mockStore.archiveOrder(id),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'orders')) throw error;
      return mockStore.archiveOrder(id);
    }
  },
};
