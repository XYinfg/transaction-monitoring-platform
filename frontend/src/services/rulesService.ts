import api from '../lib/api';
import { Rule, ApiResponse } from '../types';

export interface CreateRuleData {
  name: string;
  description: string;
  type: string;
  severity: string;
  condition: Record<string, any>;
  enabled?: boolean;
}

export const rulesService = {
  async getRules(): Promise<Rule[]> {
    const response = await api.get<ApiResponse<Rule[]>>('/rules');
    return response.data.data;
  },

  async getRule(id: string): Promise<Rule> {
    const response = await api.get<ApiResponse<Rule>>(`/rules/${id}`);
    return response.data.data;
  },

  async createRule(data: CreateRuleData): Promise<Rule> {
    const response = await api.post<ApiResponse<Rule>>('/rules', data);
    return response.data.data;
  },

  async updateRule(id: string, data: Partial<CreateRuleData>): Promise<Rule> {
    const response = await api.patch<ApiResponse<Rule>>(`/rules/${id}`, data);
    return response.data.data;
  },

  async deleteRule(id: string): Promise<void> {
    await api.delete(`/rules/${id}`);
  },

  async enableRule(id: string): Promise<Rule> {
    const response = await api.post<ApiResponse<Rule>>(`/rules/${id}/enable`);
    return response.data.data;
  },

  async disableRule(id: string): Promise<Rule> {
    const response = await api.post<ApiResponse<Rule>>(`/rules/${id}/disable`);
    return response.data.data;
  },
};
