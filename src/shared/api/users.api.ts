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

/** `password` передается только при смене пароля; пустая строка — пустой пароль. */
export type UpdateUserPayload = Partial<Omit<User, 'id' | 'lastLoginAt'>> & { password?: string };

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
  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    try {
      const { data } = await httpClient.put<User>(`/users/${id}`, payload);
      return data;
    } catch (error) {
      if (!shouldUseMockFallback(error, 'users')) throw error;
      // в мок-хранилище паролей нет
      const rest = { ...payload };
      delete rest.password;
      return mockStore.updateUser(id, rest);
    }
  },
  async remove(id: string): Promise<void> {
    try {
      await httpClient.delete(`/users/${id}`);
    } catch (error) {
      if (!shouldUseMockFallback(error, 'users')) throw error;
      await mockStore.deleteUser(id);
    }
  },
};
