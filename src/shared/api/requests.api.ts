import type { RequestArchive } from '@/entities';
import { httpClient } from './http-client';

export type CreateRequestArchivePayload = {
  requestDate: string;
  contractor: string;
  addresses: string;
  file?: File | null;
};

export const requestsApi = {
  async list(): Promise<RequestArchive[]> {
    const { data } = await httpClient.get<unknown>('/requests');
    if (Array.isArray(data)) return data as RequestArchive[];
    throw new Error('Backend returned invalid payload for GET /requests');
  },
  async create(payload: CreateRequestArchivePayload): Promise<RequestArchive> {
    const formData = new FormData();
    formData.append('requestDate', payload.requestDate);
    formData.append('contractor', payload.contractor);
    formData.append('addresses', payload.addresses);
    if (payload.file) formData.append('file', payload.file);
    const { data } = await httpClient.post<RequestArchive>('/requests', formData, {
      headers: { 'Content-Type': undefined },
    });
    return data;
  },
  async remove(id: string): Promise<void> {
    await httpClient.delete(`/requests/${id}`);
  },
};
