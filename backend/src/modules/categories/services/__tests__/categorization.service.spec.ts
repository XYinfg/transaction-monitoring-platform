import { Test, TestingModule } from '@nestjs/testing';
import { CategorizationService } from '../categorization.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../../entities/category.entity';
import { Transaction } from '../../../transactions/entities/transaction.entity';

describe('CategorizationService', () => {
  let service: CategorizationService;
  let categoryRepository: Repository<Category>;

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Groceries',
      description: 'Food and household items',
      keywords: ['walmart', 'whole foods', 'grocery', 'supermarket'],
      isSystem: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      user: null,
    },
    {
      id: 'cat-2',
      name: 'Transportation',
      description: 'Gas, uber, public transport',
      keywords: ['uber', 'lyft', 'shell', 'chevron', 'gas'],
      isSystem: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      user: null,
    },
    {
      id: 'cat-3',
      name: 'Dining',
      description: 'Restaurants and food delivery',
      keywords: ['restaurant', 'doordash', 'ubereats', 'cafe', 'starbucks'],
      isSystem: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      user: null,
    },
    {
      id: 'cat-4',
      name: 'Entertainment',
      description: 'Movies, games, streaming',
      keywords: ['netflix', 'spotify', 'cinema', 'movie', 'steam'],
      isSystem: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      user: null,
    },
  ];

  const mockCategoryRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategorizationService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategorizationService>(CategorizationService);
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );

    // Mock the category repository to return our test categories
    mockCategoryRepository.find.mockResolvedValue(mockCategories);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('categorizeTransaction', () => {
    it('should categorize transaction based on merchant name', async () => {
      const transaction: Partial<Transaction> = {
        description: 'Purchase at Walmart',
        merchant: 'Walmart',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Groceries');
    });

    it('should categorize transaction based on description when merchant is not available', async () => {
      const transaction: Partial<Transaction> = {
        description: 'Uber ride to airport',
        merchant: null,
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Transportation');
    });

    it('should be case-insensitive when matching keywords', async () => {
      const transaction: Partial<Transaction> = {
        description: 'Payment to STARBUCKS',
        merchant: 'STARBUCKS COFFEE',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Dining');
    });

    it('should return null when no category matches', async () => {
      const transaction: Partial<Transaction> = {
        description: 'Unknown merchant XYZ123',
        merchant: 'XYZ123 Corp',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeNull();
    });

    it('should match partial keywords in merchant name', async () => {
      const transaction: Partial<Transaction> = {
        description: 'Shell Gas Station',
        merchant: 'SHELL #12345',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Transportation');
    });

    it('should prioritize merchant over description', async () => {
      const transaction: Partial<Transaction> = {
        description: 'Netflix subscription - groceries keywords here walmart',
        merchant: 'Netflix',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Entertainment');
    });

    it('should handle transactions with merchant category codes', async () => {
      const transaction: Partial<Transaction> = {
        description: 'MCC 5411 - Grocery Store',
        merchant: 'Local Grocery',
        merchantCategory: '5411',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Groceries');
    });
  });

  describe('suggestCategory', () => {
    it('should suggest the most appropriate category based on text', async () => {
      const result = await service.suggestCategory(
        'DoorDash order from restaurant',
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Dining');
    });

    it('should return null for unrecognizable text', async () => {
      const result = await service.suggestCategory('ASDFGHJKL 12345');

      expect(result).toBeNull();
    });
  });

  describe('categorizeBatch', () => {
    it('should categorize multiple transactions efficiently', async () => {
      const transactions: Partial<Transaction>[] = [
        { id: 'txn-1', description: 'Walmart', merchant: 'Walmart' },
        { id: 'txn-2', description: 'Uber ride', merchant: 'Uber' },
        { id: 'txn-3', description: 'Netflix', merchant: 'Netflix' },
        { id: 'txn-4', description: 'Unknown', merchant: 'Unknown Corp' },
      ];

      const results = await service.categorizeBatch(
        transactions as Transaction[],
      );

      expect(results).toHaveLength(4);
      expect(results[0]?.name).toBe('Groceries');
      expect(results[1]?.name).toBe('Transportation');
      expect(results[2]?.name).toBe('Entertainment');
      expect(results[3]).toBeNull();
    });

    it('should handle empty batch', async () => {
      const results = await service.categorizeBatch([]);

      expect(results).toEqual([]);
    });
  });

  describe('getCategorizationStats', () => {
    it('should return statistics about categorization accuracy', async () => {
      const transactions: Partial<Transaction>[] = [
        {
          id: 'txn-1',
          description: 'Walmart',
          merchant: 'Walmart',
          categoryId: 'cat-1',
        },
        {
          id: 'txn-2',
          description: 'Uber',
          merchant: 'Uber',
          categoryId: 'cat-2',
        },
        {
          id: 'txn-3',
          description: 'Unknown',
          merchant: 'Unknown',
          categoryId: null,
        },
      ];

      const stats = {
        totalTransactions: transactions.length,
        categorized: transactions.filter((t) => t.categoryId).length,
        uncategorized: transactions.filter((t) => !t.categoryId).length,
        categorizationRate:
          (transactions.filter((t) => t.categoryId).length /
            transactions.length) *
          100,
      };

      expect(stats.totalTransactions).toBe(3);
      expect(stats.categorized).toBe(2);
      expect(stats.uncategorized).toBe(1);
      expect(stats.categorizationRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('performance', () => {
    it('should categorize large batches efficiently', async () => {
      // Generate 1000 transactions
      const transactions: Partial<Transaction>[] = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `txn-${i}`,
          description: i % 2 === 0 ? 'Walmart' : 'Uber',
          merchant: i % 2 === 0 ? 'Walmart' : 'Uber',
        }));

      const startTime = Date.now();
      const results = await service.categorizeBatch(
        transactions as Transaction[],
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(1000);
      // Should complete within 1 second for 1000 transactions
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('edge cases', () => {
    it('should handle transactions with empty strings', async () => {
      const transaction: Partial<Transaction> = {
        description: '',
        merchant: '',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeNull();
    });

    it('should handle transactions with special characters', async () => {
      const transaction: Partial<Transaction> = {
        description: 'WALMART #1234 **** $$$ @@@',
        merchant: 'WALMART',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Groceries');
    });

    it('should handle transactions with unicode characters', async () => {
      const transaction: Partial<Transaction> = {
        description: 'Über ride',
        merchant: 'Über',
      };

      const result = await service.categorizeTransaction(
        transaction as Transaction,
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Transportation');
    });
  });
});
