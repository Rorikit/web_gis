import axios from 'axios';
import type { ApiModule } from '@/shared/config/env';
import { isMockFallbackEnabledFor } from '@/shared/config/env';

export const shouldUseMockFallback = (error: unknown, module: ApiModule) => {
  if (!isMockFallbackEnabledFor(module)) return false;
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;

  const contentType = String(error.response.headers?.['content-type'] ?? '');
  return error.response.status === 404 && contentType.includes('text/html');
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const fallbackOrThrow = <T>(module: ApiModule, message: string, fallbackFactory: () => T): T => {
  if (!isMockFallbackEnabledFor(module)) {
    throw new Error(message);
  }

  return fallbackFactory();
};
