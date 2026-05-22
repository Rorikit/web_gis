import type { User } from '@/entities';
import { httpClient } from './http-client';
import { shouldUseMockFallback } from './mock-fallback';
import { mockStore } from './mock-store';

export const usersApi = {
  async list(): Promise<User[]> {
    try {
      const { data } = await httpClient.get<unknown>('/users');
      return Array.isArray(data) ? (data as User[]) : mockStore.users();
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.users();
    }
  },
  async update(id: string, payload: Partial<User>): Promise<User> {
    try {
      const { data } = await httpClient.put<User>(`/users/${id}`, payload);
      return data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return mockStore.updateUser(id, payload);
    }
  },
};
