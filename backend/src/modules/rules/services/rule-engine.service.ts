import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, Between } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Account } from '../../accounts/entities/account.entity';
import { Rule, RuleType } from '../entities/rule.entity';
import { AlertsService } from '../../alerts/alerts.service';
import { DateUtil } from '../../../common/utils/date.util';
import { MoneyUtil } from '../../../common/utils/money.util';

@Injectable()
export class RuleEngineService {
  constructor(
    @InjectRepository(Rule)
    private rulesRepository: Repository<Rule>,
    @InjectDataSource()
    private dataSource: DataSource,
    private alertsService: AlertsService,
  ) {}

  async evaluateTransaction(transactionId: string): Promise<void> {
    const transactionRepo = this.dataSource.getRepository(Transaction);
    const transaction = await transactionRepo.findOne({
      where: { id: transactionId },
      relations: ['account'],
    });

    if (!transaction) {
      return;
    }

    const rules = await this.rulesRepository.find({ where: { enabled: true } });

    for (const rule of rules) {
      const violated = await this.checkRule(rule, transaction);

      if (violated) {
        await this.alertsService.create({
          userId: transaction.account.userId,
          transactionId: transaction.id,
          ruleId: rule.id,
          context: violated.context,
        });
      }
    }
  }

  private async checkRule(
    rule: Rule,
    transaction: Transaction,
  ): Promise<{ violated: boolean; context: any } | null> {
    switch (rule.type) {
      case RuleType.LARGE_TRANSACTION:
        return this.checkLargeTransaction(rule, transaction);

      case RuleType.VELOCITY:
        return this.checkVelocity(rule, transaction);

      case RuleType.STRUCTURING:
        return this.checkStructuring(rule, transaction);

      case RuleType.UNUSUAL_PATTERN:
        return this.checkUnusualPattern(rule, transaction);

      default:
        return null;
    }
  }

  private async checkLargeTransaction(
    rule: Rule,
    transaction: Transaction,
  ): Promise<{ violated: boolean; context: any } | null> {
    const { multiplier = 3, lookbackDays = 30 } = rule.condition;

    const transactionRepo = this.dataSource.getRepository(Transaction);

    // Use database aggregation for better performance and precision
    const result = await transactionRepo
      .createQueryBuilder('transaction')
      .select('AVG(ABS(transaction.amount))', 'avgAmount')
      .where('transaction.accountId = :accountId', { accountId: transaction.accountId })
      .andWhere('transaction.timestamp > :cutoffDate', {
        cutoffDate: DateUtil.daysAgo(lookbackDays)
      })
      .getRawOne();

    const avgAmount = result?.avgAmount ? parseFloat(result.avgAmount) : null;

    if (!avgAmount || avgAmount === 0) {
      return null; // No historical data
    }

    // Use MoneyUtil for precise multiplication
    const currentAmount = Math.abs(transaction.amount as number);
    const threshold = MoneyUtil.multiply(avgAmount, multiplier);

    if (currentAmount > threshold) {
      return {
        violated: true,
        context: {
          transactionAmount: MoneyUtil.round(currentAmount),
          averageAmount: MoneyUtil.round(avgAmount),
          multiplier,
          threshold: MoneyUtil.round(threshold),
        },
      };
    }

    return null;
  }

  private async checkVelocity(
    rule: Rule,
    transaction: Transaction,
  ): Promise<{ violated: boolean; context: any } | null> {
    const { count = 10, windowMinutes = 60 } = rule.condition;

    const transactionRepo = this.dataSource.getRepository(Transaction);

    const windowStart = new Date(transaction.timestamp);
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    const recentCount = await transactionRepo.count({
      where: {
        accountId: transaction.accountId,
        timestamp: Between(windowStart, transaction.timestamp),
      },
    });

    if (recentCount >= count) {
      return {
        violated: true,
        context: {
          transactionCount: recentCount,
          threshold: count,
          windowMinutes,
        },
      };
    }

    return null;
  }

  private async checkStructuring(
    rule: Rule,
    transaction: Transaction,
  ): Promise<{ violated: boolean; context: any } | null> {
    const { threshold = 10000, tolerance = 0.1, count = 3, windowHours = 24 } = rule.condition;

    const transactionRepo = this.dataSource.getRepository(Transaction);

    const windowStart = new Date(transaction.timestamp);
    windowStart.setHours(windowStart.getHours() - windowHours);

    // Calculate bounds using MoneyUtil for precision
    const lowerBound = MoneyUtil.multiply(threshold, (1 - tolerance));
    const upperBound = threshold;

    // Use database query to count matching transactions
    const matchCount = await transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.accountId = :accountId', { accountId: transaction.accountId })
      .andWhere('transaction.timestamp BETWEEN :start AND :end', {
        start: windowStart,
        end: transaction.timestamp
      })
      .andWhere('ABS(transaction.amount) > :lowerBound', { lowerBound })
      .andWhere('ABS(transaction.amount) < :upperBound', { upperBound })
      .getCount();

    if (matchCount >= count) {
      return {
        violated: true,
        context: {
          matchingTransactions: matchCount,
          threshold: MoneyUtil.round(threshold),
          tolerance,
          windowHours,
          lowerBound: MoneyUtil.round(lowerBound),
        },
      };
    }

    return null;
  }

  private async checkUnusualPattern(
    rule: Rule,
    transaction: Transaction,
  ): Promise<{ violated: boolean; context: any } | null> {
    const { stdDevMultiplier = 2.5, lookbackDays = 90 } = rule.condition;

    const transactionRepo = this.dataSource.getRepository(Transaction);

    // Use database statistical functions for performance
    const result = await transactionRepo
      .createQueryBuilder('transaction')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(ABS(transaction.amount))', 'mean')
      .addSelect('STDDEV_POP(ABS(transaction.amount))', 'stdDev')
      .where('transaction.accountId = :accountId', { accountId: transaction.accountId })
      .andWhere('transaction.timestamp > :cutoffDate', {
        cutoffDate: DateUtil.daysAgo(lookbackDays)
      })
      .getRawOne();

    const count = parseInt(result?.count || '0');
    const mean = result?.mean ? parseFloat(result.mean) : 0;
    const stdDev = result?.stdDev ? parseFloat(result.stdDev) : 0;

    if (count < 10 || !mean || !stdDev) {
      return null; // Not enough data
    }

    const currentAmount = Math.abs(transaction.amount as number);
    // Use MoneyUtil for precise multiplication
    const threshold = MoneyUtil.add(mean, MoneyUtil.multiply(stdDev, stdDevMultiplier));

    if (currentAmount > threshold) {
      const deviations = stdDev > 0 ? (currentAmount - mean) / stdDev : 0;

      return {
        violated: true,
        context: {
          transactionAmount: MoneyUtil.round(currentAmount),
          mean: MoneyUtil.round(mean),
          stdDev: MoneyUtil.round(stdDev),
          deviations: MoneyUtil.round(deviations),
          threshold: MoneyUtil.round(threshold),
        },
      };
    }

    return null;
  }

  async runRulesForAccount(accountId: string): Promise<number> {
    const transactionRepo = this.dataSource.getRepository(Transaction);

    // Get recent transactions (last 24 hours)
    const recentTransactions = await transactionRepo.find({
      where: {
        accountId,
        timestamp: MoreThan(DateUtil.daysAgo(1)),
      },
    });

    let alertsGenerated = 0;

    for (const transaction of recentTransactions) {
      await this.evaluateTransaction(transaction.id);
      alertsGenerated++;
    }

    return alertsGenerated;
  }
}
