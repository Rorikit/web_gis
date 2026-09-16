import axios from 'axios';

/** Текст ошибки из ответа бэкенда (`{ detail }`) либо запасной вариант. */
export const errorDetail = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string' && detail) return detail;
  }
  return fallback;
};
