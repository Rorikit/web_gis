import { endpoints } from './endpoints';
import { httpClient } from './http-client';
import { textBlob } from '@/shared/lib/download';
import { shouldUseMockFallback } from './mock-fallback';

export const reportsApi = {
  async createReference(payload: { reportDate: string }): Promise<Blob> {
    try {
      const { data } = await httpClient.post(endpoints.reports.reference, payload, { responseType: 'blob' });
      return data;
    } catch (error) {
      if (!shouldUseMockFallback(error, 'reports')) throw error;
      return textBlob(`Справка на ${payload.reportDate}`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
  },
  async createDamageCard(payload: Record<string, unknown>): Promise<Blob> {
    try {
      const { data } = await httpClient.post(endpoints.reports.damageCard, payload, { responseType: 'blob' });
      return data;
    } catch (error) {
      if (!shouldUseMockFallback(error, 'reports')) throw error;
      return textBlob('Карта повреждения', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
  },
};
