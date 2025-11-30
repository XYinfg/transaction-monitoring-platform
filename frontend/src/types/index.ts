export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'analyst' | 'admin';
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  currency: string;
  balance: number;
  accountType?: string;
  institutionName?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  balanceAfter?: number;
  merchant?: string;
  merchantCategory?: string;
  categoryId?: string;
  category?: Category;
  source: 'csv_upload' | 'manual' | 'api' | 'synthetic';
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: 'large_transaction' | 'velocity' | 'structuring' | 'unusual_pattern' | 'foreign_transaction' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: Record<string, any>;
  enabled: boolean;
  autoResolve: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  transactionId?: string;
  ruleId: string;
  status: 'open' | 'reviewing' | 'resolved' | 'false_positive' | 'escalated';
  notes?: string;
  context?: Record<string, any>;
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  transaction?: Transaction;
  rule?: Rule;
}

export interface SpendingSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  transactionCount: number;
  averageTransaction: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface CashflowData {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TrendData {
  period: string;
  amount: number;
  count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
  path: string;
}
