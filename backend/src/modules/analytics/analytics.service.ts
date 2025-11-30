import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { DateUtil } from '../../common/utils/date.util';

export interface SpendingSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  transactionCount: number;
  averageTransaction: number;
  period: { start: Date; end: Date };
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

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async getSpendingSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SpendingSummary> {
    const accounts = await this.accountsRepository.find({ where: { userId } });
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netCashflow: 0,
        transactionCount: 0,
        averageTransaction: 0,
        period: {
          start: startDate || DateUtil.monthsAgo(1),
          end: endDate || new Date(),
        },
      };
    }

    const query = this.transactionsRepository.createQueryBuilder('transaction');

    query.where('transaction.accountId IN (:...accountIds)', { accountIds });

    if (startDate && endDate) {
      query.andWhere('transaction.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const transactions = await query.getMany();

    const totalIncome = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + (t.amount as number), 0);

    const totalExpenses = Math.abs(
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + (t.amount as number), 0),
    );

    return {
      totalIncome,
      totalExpenses,
      netCashflow: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      averageTransaction:
        transactions.length > 0
          ? transactions.reduce((sum, t) => sum + Math.abs(t.amount as number), 0) /
            transactions.length
          : 0,
      period: {
        start: startDate || DateUtil.monthsAgo(1),
        end: endDate || new Date(),
      },
    };
  }

  async getCategoryBreakdown(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CategoryBreakdown[]> {
    const accounts = await this.accountsRepository.find({ where: { userId } });
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return [];
    }

    const query = this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('SUM(ABS(transaction.amount))', 'totalAmount')
      .addSelect('COUNT(transaction.id)', 'transactionCount')
      .where('transaction.accountId IN (:...accountIds)', { accountIds })
      .andWhere('transaction.amount < 0') // Only expenses
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('totalAmount', 'DESC');

    if (startDate && endDate) {
      query.andWhere('transaction.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();

    const total = results.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);

    return results.map((r) => ({
      categoryId: r.categoryId || 'uncategorized',
      categoryName: r.categoryName || 'Uncategorized',
      totalAmount: parseFloat(r.totalAmount),
      transactionCount: parseInt(r.transactionCount),
      percentage: total > 0 ? (parseFloat(r.totalAmount) / total) * 100 : 0,
    }));
  }

  async getCashflowData(
    userId: string,
    days: number = 30,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<CashflowData[]> {
    const accounts = await this.accountsRepository.find({ where: { userId } });
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return [];
    }

    const startDate = DateUtil.daysAgo(days);
    const endDate = new Date();

    const transactions = await this.transactionsRepository.find({
      where: {
        accountId: In(accountIds) as any,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });

    // Group by date
    const grouped = new Map<string, { income: number; expenses: number }>();

    transactions.forEach((t) => {
      const dateKey = this.getDateKey(t.timestamp, groupBy);

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, { income: 0, expenses: 0 });
      }

      const data = grouped.get(dateKey)!;

      if (t.amount > 0) {
        data.income += t.amount as number;
      } else {
        data.expenses += Math.abs(t.amount as number);
      }
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getSpendingTrends(
    userId: string,
    months: number = 6,
  ): Promise<TrendData[]> {
    const accounts = await this.accountsRepository.find({ where: { userId } });
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return [];
    }

    const startDate = DateUtil.monthsAgo(months);

    const transactions = await this.transactionsRepository.find({
      where: {
        accountId: In(accountIds) as any,
        timestamp: MoreThan(startDate),
        amount: LessThan(0) as any, // Only expenses
      },
      order: { timestamp: 'ASC' },
    });

    const grouped = new Map<string, { amount: number; count: number }>();

    transactions.forEach((t) => {
      const monthKey = t.timestamp.toISOString().slice(0, 7); // YYYY-MM

      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { amount: 0, count: 0 });
      }

      const data = grouped.get(monthKey)!;
      data.amount += Math.abs(t.amount as number);
      data.count += 1;
    });

    return Array.from(grouped.entries())
      .map(([period, data]) => ({
        period,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  async getTopMerchants(
    userId: string,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    const accounts = await this.accountsRepository.find({ where: { userId } });
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return [];
    }

    const query = this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('transaction.merchant', 'merchant')
      .addSelect('SUM(ABS(transaction.amount))', 'totalAmount')
      .addSelect('COUNT(transaction.id)', 'transactionCount')
      .where('transaction.accountId IN (:...accountIds)', { accountIds })
      .andWhere('transaction.merchant IS NOT NULL')
      .andWhere('transaction.amount < 0') // Only expenses
      .groupBy('transaction.merchant')
      .orderBy('totalAmount', 'DESC')
      .limit(limit);

    if (startDate && endDate) {
      query.andWhere('transaction.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();

    return results.map((r) => ({
      merchant: r.merchant,
      totalAmount: parseFloat(r.totalAmount),
      transactionCount: parseInt(r.transactionCount),
    }));
  }

  private getDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const d = new Date(date);

    switch (groupBy) {
      case 'day':
        return d.toISOString().slice(0, 10); // YYYY-MM-DD

      case 'week':
        const week = this.getWeekNumber(d);
        return `${d.getFullYear()}-W${week}`;

      case 'month':
        return d.toISOString().slice(0, 7); // YYYY-MM

      default:
        return d.toISOString().slice(0, 10);
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}

// Import missing operators
import { In, LessThan } from 'typeorm';
