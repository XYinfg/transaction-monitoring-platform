import api from '../lib/api';
import { SpendingSummary, CategoryBreakdown, CashflowData, TrendData, ApiResponse } from '../types';

export const analyticsService = {
  async getSummary(startDate?: string, endDate?: string): Promise<SpendingSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<SpendingSummary>>(
      `/analytics/summary?${params.toString()}`,
    );
    return response.data.data;
  },

  async getCategoryBreakdown(startDate?: string, endDate?: string): Promise<CategoryBreakdown[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<CategoryBreakdown[]>>(
      `/analytics/by-category?${params.toString()}`,
    );
    return response.data.data;
  },

  async getCashflow(days: number = 30, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<CashflowData[]> {
    const response = await api.get<ApiResponse<CashflowData[]>>(
      `/analytics/cashflow?days=${days}&groupBy=${groupBy}`,
    );
    return response.data.data;
  },

  async getTrends(months: number = 6): Promise<TrendData[]> {
    const response = await api.get<ApiResponse<TrendData[]>>(
      `/analytics/trends?months=${months}`,
    );
    return response.data.data;
  },

  async getTopMerchants(limit: number = 10, startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<any[]>>(
      `/analytics/top-merchants?${params.toString()}`,
    );
    return response.data.data;
  },
};
