import type { User } from '@/entities';
import { httpClient } from './http-client';
import { shouldUseMockFallback, fallbackOrThrow } from './mock-fallback';
import { mockStore } from './mock-store';

export type CreateUserPayload = {
  ldapLogin: string;
  password: string;
  fullName: string;
  role: User['role'];
  districtId: string | null;
  isActive: boolean;
};

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
  async create(payload: CreateUserPayload): Promise<User> {
    try {
      const { data } = await httpClient.post<User>('/users', payload);
      return data;
    } catch (error) {
      if (!shouldUseMockFallback(error, 'users')) throw error;
      return mockStore.createUser(payload);
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
