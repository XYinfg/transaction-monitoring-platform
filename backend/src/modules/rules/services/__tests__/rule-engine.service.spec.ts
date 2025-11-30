import { Test, TestingModule } from '@nestjs/testing';
import { RuleEngineService } from '../rule-engine.service';
import { DataSource } from 'typeorm';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Transaction } from '../../../transactions/entities/transaction.entity';
import { Rule, RuleType } from '../../entities/rule.entity';
import { AlertsService } from '../../../alerts/alerts.service';

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let dataSource: DataSource;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getCount: jest.fn(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockDataSource = {
    getRepository: jest.fn(() => mockRepository),
  };

  const mockAlertsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        {
          provide: getRepositoryToken(Rule),
          useValue: mockRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: AlertsService,
          useValue: mockAlertsService,
        },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLargeTransaction', () => {
    const mockRule: Rule = {
      id: 'rule-1',
      name: 'Large Transaction',
      description: 'Detects large transactions',
      type: RuleType.LARGE_TRANSACTION,
      severity: 'high',
      condition: { multiplier: 3, lookbackDays: 30 },
      enabled: true,
      autoResolve: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      alerts: [],
    };

    const mockTransaction = {
      id: 'txn-1',
      accountId: 'acc-1',
      timestamp: new Date(),
      description: 'Large purchase',
      amount: 15000,
      currency: 'USD',
      balanceAfter: 50000,
      merchant: 'Luxury Store',
      merchantCategory: 'Retail',
      categoryId: null,
      source: 'csv_upload',
      referenceNumber: 'REF-001',
      idempotencyKey: 'idem-001',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      account: { userId: 'user-1' } as any,
      category: null,
      alerts: [],
    } as Transaction;

    it('should detect a transaction as large when it exceeds the multiplier threshold', async () => {
      // Mock database query result with average of $1000
      mockQueryBuilder.getRawOne.mockResolvedValue({
        avgAmount: '1000',
      });

      const result = await service['checkLargeTransaction'](
        mockRule,
        mockTransaction,
      );

      expect(result).not.toBeNull();
      expect(result.violated).toBe(true);
      expect(result.context).toMatchObject({
        transactionAmount: 15000,
        averageAmount: 1000,
        multiplier: 3,
        threshold: 3000,
      });
    });

    it('should not detect a transaction as large when it does not exceed threshold', async () => {
      const smallTransaction = { ...mockTransaction, amount: 2000 } as Transaction;

      // Mock average of $1000, threshold would be $3000
      mockQueryBuilder.getRawOne.mockResolvedValue({
        avgAmount: '1000',
      });

      const result = await service['checkLargeTransaction'](
        mockRule,
        smallTransaction,
      );

      expect(result).toBeNull();
    });

    it('should not violate when there are no recent transactions', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        avgAmount: null,
      });

      const result = await service['checkLargeTransaction'](
        mockRule,
        mockTransaction,
      );

      expect(result).toBeNull();
    });
  });

  describe('checkVelocity', () => {
    const mockRule: Rule = {
      id: 'rule-2',
      name: 'Velocity Check',
      description: 'Detects rapid transactions',
      type: RuleType.VELOCITY,
      severity: 'medium',
      condition: { count: 10, windowMinutes: 60 },
      enabled: true,
      autoResolve: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      alerts: [],
    };

    const mockTransaction = {
      id: 'txn-1',
      accountId: 'acc-1',
      timestamp: new Date(),
      description: 'Purchase',
      amount: 100,
      currency: 'USD',
      balanceAfter: 50000,
      merchant: 'Store',
      merchantCategory: 'Retail',
      categoryId: null,
      source: 'csv_upload',
      referenceNumber: 'REF-001',
      idempotencyKey: 'idem-001',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      account: { userId: 'user-1' } as any,
      category: null,
      alerts: [],
    } as Transaction;

    it('should detect velocity violation when transactions exceed limit', async () => {
      // Mock 12 transactions in the window (exceeds limit of 10)
      mockRepository.count.mockResolvedValue(12);

      const result = await service['checkVelocity'](mockRule, mockTransaction);

      expect(result).not.toBeNull();
      expect(result.violated).toBe(true);
      expect(result.context).toMatchObject({
        transactionCount: 12,
        threshold: 10,
        windowMinutes: 60,
      });
    });

    it('should not detect velocity violation when within limit', async () => {
      // Mock 8 transactions (below limit of 10)
      mockRepository.count.mockResolvedValue(8);

      const result = await service['checkVelocity'](mockRule, mockTransaction);

      expect(result).toBeNull();
    });
  });

  describe('checkStructuring', () => {
    const mockRule: Rule = {
      id: 'rule-3',
      name: 'Structuring Detection',
      description: 'Detects structuring patterns',
      type: RuleType.STRUCTURING,
      severity: 'high',
      condition: { threshold: 10000, tolerance: 0.1, count: 3, windowHours: 24 },
      enabled: true,
      autoResolve: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      alerts: [],
    };

    const mockTransaction = {
      id: 'txn-1',
      accountId: 'acc-1',
      timestamp: new Date(),
      description: 'Purchase',
      amount: 9500,
      currency: 'USD',
      balanceAfter: 50000,
      merchant: 'Store',
      merchantCategory: 'Retail',
      categoryId: null,
      source: 'csv_upload',
      referenceNumber: 'REF-001',
      idempotencyKey: 'idem-001',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      account: { userId: 'user-1' } as any,
      category: null,
      alerts: [],
    } as Transaction;

    it('should detect structuring when multiple transactions just below threshold', async () => {
      // Mock 4 transactions in the range (exceeds count of 3)
      mockQueryBuilder.getCount.mockResolvedValue(4);

      const result = await service['checkStructuring'](
        mockRule,
        mockTransaction,
      );

      expect(result).not.toBeNull();
      expect(result.violated).toBe(true);
      expect(result.context).toMatchObject({
        matchingTransactions: 4,
        threshold: 10000,
        tolerance: 0.1,
        windowHours: 24,
        lowerBound: 9000,
      });
    });

    it('should not detect structuring when below count threshold', async () => {
      // Mock only 2 transactions (below threshold of 3)
      mockQueryBuilder.getCount.mockResolvedValue(2);

      const result = await service['checkStructuring'](
        mockRule,
        mockTransaction,
      );

      expect(result).toBeNull();
    });
  });

  describe('checkUnusualPattern', () => {
    const mockRule: Rule = {
      id: 'rule-4',
      name: 'Unusual Pattern',
      description: 'Detects unusual patterns',
      type: RuleType.UNUSUAL_PATTERN,
      severity: 'medium',
      condition: { stdDevMultiplier: 2.5, lookbackDays: 90 },
      enabled: true,
      autoResolve: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      alerts: [],
    };

    const mockTransaction = {
      id: 'txn-1',
      accountId: 'acc-1',
      timestamp: new Date(),
      description: 'Purchase',
      amount: 5000,
      currency: 'USD',
      balanceAfter: 50000,
      merchant: 'Store',
      merchantCategory: 'Retail',
      categoryId: null,
      source: 'csv_upload',
      referenceNumber: 'REF-001',
      idempotencyKey: 'idem-001',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      account: { userId: 'user-1' } as any,
      category: null,
      alerts: [],
    } as Transaction;

    it('should detect unusual pattern when transaction is statistical outlier', async () => {
      // Mock stats: mean=$100, stdDev=$20, count=15
      // Threshold = 100 + (20 * 2.5) = 150
      // Transaction of $5000 exceeds threshold
      mockQueryBuilder.getRawOne.mockResolvedValue({
        count: '15',
        mean: '100',
        stdDev: '20',
      });

      const result = await service['checkUnusualPattern'](
        mockRule,
        mockTransaction,
      );

      expect(result).not.toBeNull();
      expect(result.violated).toBe(true);
      expect(result.context).toMatchObject({
        transactionAmount: 5000,
        mean: 100,
        stdDev: 20,
        threshold: 150,
      });
      expect(result.context.deviations).toBeGreaterThan(2.5);
    });

    it('should not detect unusual pattern when transaction is within normal range', async () => {
      const normalTransaction = { ...mockTransaction, amount: 140 } as Transaction;

      // Threshold = 100 + (20 * 2.5) = 150
      // Transaction of $140 is within threshold
      mockQueryBuilder.getRawOne.mockResolvedValue({
        count: '15',
        mean: '100',
        stdDev: '20',
      });

      const result = await service['checkUnusualPattern'](
        mockRule,
        normalTransaction,
      );

      expect(result).toBeNull();
    });

    it('should not violate when insufficient transaction history', async () => {
      // Only 5 transactions, below the minimum of 10
      mockQueryBuilder.getRawOne.mockResolvedValue({
        count: '5',
        mean: '100',
        stdDev: '20',
      });

      const result = await service['checkUnusualPattern'](
        mockRule,
        mockTransaction,
      );

      expect(result).toBeNull();
    });
  });
});
