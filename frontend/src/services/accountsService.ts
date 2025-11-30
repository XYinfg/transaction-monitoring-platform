import api from '../lib/api';
import { Account, ApiResponse } from '../types';

export interface CreateAccountData {
  name: string;
  currency: string;
  balance?: number;
  accountType?: string;
  institutionName?: string;
  accountNumber?: string;
}

export const accountsService = {
  async getAccounts(): Promise<Account[]> {
    const response = await api.get<ApiResponse<Account[]>>('/accounts');
    return response.data.data;
  },

  async getAccount(id: string): Promise<Account> {
    const response = await api.get<ApiResponse<Account>>(`/accounts/${id}`);
    return response.data.data;
  },

  async createAccount(data: CreateAccountData): Promise<Account> {
    const response = await api.post<ApiResponse<Account>>('/accounts', data);
    return response.data.data;
  },

  async updateAccount(id: string, data: Partial<CreateAccountData>): Promise<Account> {
    const response = await api.patch<ApiResponse<Account>>(`/accounts/${id}`, data);
    return response.data.data;
  },

  async deleteAccount(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },

  async getTotalBalance(currency: string = 'USD'): Promise<{ currency: string; totalBalance: number }> {
    const response = await api.get<ApiResponse<{ currency: string; totalBalance: number }>>(
      `/accounts/balance/total?currency=${currency}`,
    );
    return response.data.data;
  },
};
