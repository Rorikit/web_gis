import type { User } from '@/entities';
import { httpClient } from './http-client';
import { shouldUseMockFallback, fallbackOrThrow } from './mock-fallback';
import { mockStore } from './mock-store';

export const usersApi = {
  async list(): Promise<User[]> {
    try {
      const { data } = await httpClient.get<unknown>('/users');
      if (Array.isArray(data)) return data as User[];
      return fallbackOrThrow(
        'users',
        'Backend returned invalid payload for GET /users',
        () => mockStore.users(),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'users')) throw error;
      return mockStore.users();
    }
  },
  async update(id: string, payload: Partial<User>): Promise<User> {
    try {
      const { data } = await httpClient.put<User>(`/users/${id}`, payload);
      return data;
    } catch (error) {
      if (!shouldUseMockFallback(error, 'users')) throw error;
      return mockStore.updateUser(id, payload);
    }
  },
};
