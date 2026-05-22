import type { User } from '@/entities';
import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { isRecord, shouldUseMockFallback, fallbackOrThrow } from './mock-fallback';
import { mockStore } from './mock-store';

export type LoginPayload = {
  ldapLogin: string;
  password: string;
};

export const authApi = {
  async login(payload: LoginPayload): Promise<User> {
    try {
      const { data } = await httpClient.post<unknown>(endpoints.auth.login, payload);
      if (isRecord(data) && typeof data.ldapLogin === 'string') return data as User;
      return fallbackOrThrow(
        'auth',
        'Backend returned invalid payload for POST /auth/ldap/login',
        () => mockStore.login(payload.ldapLogin),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'auth')) throw error;
      return mockStore.login(payload.ldapLogin);
    }
  },
  async logout(): Promise<void> {
    try {
      await httpClient.post(endpoints.auth.logout);
    } catch (error) {
      if (!shouldUseMockFallback(error, 'auth')) throw error;
      await mockStore.logout();
    }
  },
  async me(): Promise<User | null> {
    try {
      const { data } = await httpClient.get<unknown>(endpoints.auth.me);
      if (data === null) return null;
      if (isRecord(data) && typeof data.ldapLogin === 'string') return data as User;
      return fallbackOrThrow(
        'auth',
        'Backend returned invalid payload for GET /auth/me',
        () => mockStore.me(),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error, 'auth')) throw error;
      return mockStore.me();
    }
  },
};
