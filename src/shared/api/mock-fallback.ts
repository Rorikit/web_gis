import axios from 'axios';

export const shouldUseMockFallback = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;

  const contentType = String(error.response.headers?.['content-type'] ?? '');
  return error.response.status === 404 && contentType.includes('text/html');
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
