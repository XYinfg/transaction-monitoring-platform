import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from './entities/category.entity';
import { CategorizationRule, RuleMatchType } from './entities/categorization-rule.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateRuleDto } from './dto/create-rule.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(CategorizationRule)
    private rulesRepository: Repository<CategorizationRule>,
    private dataSource: DataSource,
  ) {}

  // Category CRUD
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findCategory(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findCategory(id);
    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.findCategory(id);

    if (category.isSystem) {
      throw new Error('Cannot delete system categories');
    }

    await this.categoriesRepository.remove(category);
  }

  // Categorization Rules
  async createRule(createRuleDto: CreateRuleDto): Promise<CategorizationRule> {
    const rule = this.rulesRepository.create(createRuleDto);
    return this.rulesRepository.save(rule);
  }

  async findAllRules(): Promise<CategorizationRule[]> {
    return this.rulesRepository.find({
      relations: ['category'],
      order: { priority: 'DESC' },
    });
  }

  async findRulesByCategory(categoryId: string): Promise<CategorizationRule[]> {
    return this.rulesRepository.find({
      where: { categoryId },
      order: { priority: 'DESC' },
    });
  }

  async removeRule(id: string): Promise<void> {
    await this.rulesRepository.delete(id);
  }

  // Categorization Logic
  async categorizeTransaction(transactionId: string): Promise<Transaction> {
    const transactionRepo = this.dataSource.getRepository(Transaction);
    const transaction = await transactionRepo.findOne({ where: { id: transactionId } });

    if (!transaction) {
      throw new NotFoundException(`Transaction not found`);
    }

    // Skip if already categorized
    if (transaction.categoryId) {
      return transaction;
    }

    const category = await this.matchCategory(transaction);

    if (category) {
      transaction.categoryId = category.id;
      return transactionRepo.save(transaction);
    }

    return transaction;
  }

  async matchCategory(transaction: Transaction): Promise<Category | null> {
    const rules = await this.findAllRules();

    const description = transaction.description.toLowerCase();
    const merchant = transaction.merchant?.toLowerCase() || '';

    // Check rules in priority order
    for (const rule of rules) {
      if (!rule.enabled) continue;

      const pattern = rule.caseSensitive ? rule.pattern : rule.pattern.toLowerCase();
      const searchText = `${description} ${merchant}`;

      let matched = false;

      switch (rule.matchType) {
        case RuleMatchType.CONTAINS:
          matched = searchText.includes(pattern);
          break;

        case RuleMatchType.STARTS_WITH:
          matched = searchText.startsWith(pattern);
          break;

        case RuleMatchType.ENDS_WITH:
          matched = searchText.endsWith(pattern);
          break;

        case RuleMatchType.EXACT:
          matched = searchText === pattern;
          break;

        case RuleMatchType.REGEX:
          try {
            const regex = new RegExp(pattern, rule.caseSensitive ? '' : 'i');
            matched = regex.test(searchText);
          } catch (e) {
            // Invalid regex, skip
            continue;
          }
          break;
      }

      if (matched) {
        return rule.category;
      }
    }

    return null;
  }

  async categorizeUncategorizedTransactions(accountId?: string): Promise<number> {
    const transactionRepo = this.dataSource.getRepository(Transaction);

    const query: any = { categoryId: null };
    if (accountId) {
      query.accountId = accountId;
    }

    const uncategorized = await transactionRepo.find({
      where: query,
    });

    let categorizedCount = 0;

    for (const transaction of uncategorized) {
      const category = await this.matchCategory(transaction);

      if (category) {
        transaction.categoryId = category.id;
        await transactionRepo.save(transaction);
        categorizedCount++;
      }
    }

    return categorizedCount;
  }

  async getCategoryStatistics(categoryId: string) {
    const transactionRepo = this.dataSource.getRepository(Transaction);

    const transactions = await transactionRepo.find({
      where: { categoryId },
    });

    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount as number),
      0,
    );

    return {
      categoryId,
      transactionCount: transactions.length,
      totalAmount,
      averageAmount: transactions.length > 0 ? totalAmount / transactions.length : 0,
    };
  }
}
