import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { textBlob } from '@/shared/lib/download';
import { shouldUseMockFallback } from './mock-fallback';

export const exportsApi = {
  async currentTable(payload: Record<string, unknown>): Promise<Blob> {
    try {
      const { data } = await httpClient.post(endpoints.exports.currentTable, payload, { responseType: 'blob' });
      return data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      return textBlob('Экспорт текущей таблицы', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
  },
};
