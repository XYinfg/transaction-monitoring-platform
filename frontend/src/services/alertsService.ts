import api from '../lib/api';
import { Alert, PaginatedResponse, ApiResponse } from '../types';

export const alertsService = {
  async getAlerts(page: number = 1, limit: number = 20, status?: string): Promise<PaginatedResponse<Alert>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get<ApiResponse<PaginatedResponse<Alert>>>(
      `/alerts?${params.toString()}`,
    );
    return response.data.data;
  },

  async getAlert(id: string): Promise<Alert> {
    const response = await api.get<ApiResponse<Alert>>(`/alerts/${id}`);
    return response.data.data;
  },

  async assignToMe(id: string): Promise<Alert> {
    const response = await api.post<ApiResponse<Alert>>(`/alerts/${id}/assign`);
    return response.data.data;
  },

  async resolve(id: string, notes?: string): Promise<Alert> {
    const response = await api.post<ApiResponse<Alert>>(`/alerts/${id}/resolve`, { notes });
    return response.data.data;
  },

  async markFalsePositive(id: string, notes?: string): Promise<Alert> {
    const response = await api.post<ApiResponse<Alert>>(`/alerts/${id}/false-positive`, { notes });
    return response.data.data;
  },

  async escalate(id: string, notes?: string): Promise<Alert> {
    const response = await api.post<ApiResponse<Alert>>(`/alerts/${id}/escalate`, { notes });
    return response.data.data;
  },

  async updateStatus(id: string, status: string, notes?: string): Promise<Alert> {
    // Map status to appropriate endpoint
    const endpoints: Record<string, string> = {
      'reviewing': `/alerts/${id}/assign`,
      'resolved': `/alerts/${id}/resolve`,
      'false_positive': `/alerts/${id}/false-positive`,
      'escalated': `/alerts/${id}/escalate`,
    };

    const endpoint = endpoints[status];
    if (!endpoint) {
      throw new Error(`Invalid status: ${status}`);
    }

    const response = await api.post<ApiResponse<Alert>>(endpoint, { notes });
    return response.data.data;
  },

  async getStatistics(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/alerts/statistics');
    return response.data.data;
  },
};
