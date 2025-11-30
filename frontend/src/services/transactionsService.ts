import api from '../lib/api';
import { Transaction, PaginatedResponse, ApiResponse } from '../types';

export const transactionsService = {
  async getTransactions(accountId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Transaction>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Transaction>>>(
      `/transactions/account/${accountId}?page=${page}&limit=${limit}`,
    );
    return response.data.data;
  },

  async importCsv(accountId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', accountId);

    const response = await api.post('/transactions/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async getStatistics(accountId: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<any>>(
      `/transactions/account/${accountId}/statistics?${params.toString()}`,
    );
    return response.data.data;
  },

  async getByCategory(accountId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<any[]>>(
      `/transactions/account/${accountId}/by-category?${params.toString()}`,
    );
    return response.data.data;
  },
};
