import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { Transaction, TransactionSource } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { DateUtil } from '../../common/utils/date.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) { }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    if (!createTransactionDto.idempotencyKey) {
      throw new BadRequestException('Idempotency key is required');
    }

    try {
      const transaction = this.transactionsRepository.create(createTransactionDto);
      return await this.transactionsRepository.save(transaction);
    } catch (error) {
      // Handle unique constraint violation (Postgres error 23505)
      if (error.code === '23505' && error.detail?.includes('idempotency_key')) {
        const existing = await this.transactionsRepository.findOne({
          where: {
            accountId: createTransactionDto.accountId,
            idempotencyKey: createTransactionDto.idempotencyKey,
          },
          relations: ['account', 'category'],
        });

        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async createBatch(transactions: CreateTransactionDto[]): Promise<Transaction[]> {
    const entities = transactions.map((dto) =>
      this.transactionsRepository.create({
        ...dto,
        idempotencyKey: dto.idempotencyKey || uuidv4(),
      }),
    );

    return this.transactionsRepository.save(entities);
  }

  async findAll(accountId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Transaction>> {
    const [data, total] = await this.transactionsRepository.findAndCount({
      where: { accountId },
      relations: ['category', 'account'],
      order: { timestamp: 'DESC' },
      skip: paginationDto.skip,
      take: paginationDto.limit,
    });

    return new PaginatedResponse(data, total, paginationDto.page, paginationDto.limit);
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['account', 'category'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByDateRange(accountId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: {
        accountId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
      relations: ['category'],
    });
  }

  async findRecent(accountId: string, days: number = 30): Promise<Transaction[]> {
    const startDate = DateUtil.daysAgo(days);

    return this.transactionsRepository.find({
      where: {
        accountId,
        timestamp: MoreThan(startDate),
      },
      order: { timestamp: 'DESC' },
      relations: ['category'],
    });
  }

  async getStatistics(accountId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = { accountId };

    if (startDate && endDate) {
      dateFilter.timestamp = Between(startDate, endDate);
    }

    const transactions = await this.transactionsRepository.find({
      where: dateFilter,
    });

    const totalDebit = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount as number), 0);

    const totalCredit = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + (t.amount as number), 0);

    return {
      totalTransactions: transactions.length,
      totalDebit,
      totalCredit,
      netAmount: totalCredit - totalDebit,
      averageTransaction: transactions.length > 0
        ? transactions.reduce((sum, t) => sum + Math.abs(t.amount as number), 0) / transactions.length
        : 0,
    };
  }

  async getTransactionsByCategory(accountId: string, startDate?: Date, endDate?: Date) {
    const query = this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.category', 'category')
      .select('category.name', 'categoryName')
      .addSelect('category.id', 'categoryId')
      .addSelect('SUM(ABS(transaction.amount))', 'totalAmount')
      .addSelect('COUNT(transaction.id)', 'count')
      .where('transaction.accountId = :accountId', { accountId })
      .groupBy('category.id')
      .addGroupBy('category.name');

    if (startDate && endDate) {
      query.andWhere('transaction.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.getRawMany();
  }

  async findDuplicates(accountId: string): Promise<Transaction[]> {
    // Find transactions with duplicate idempotency keys
    const duplicates = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('transaction.idempotencyKey', 'key')
      .where('transaction.accountId = :accountId', { accountId })
      .groupBy('transaction.idempotencyKey')
      .having('COUNT(*) > 1')
      .getRawMany();

    if (duplicates.length === 0) {
      return [];
    }

    const keys = duplicates.map((d) => d.key);

    return this.transactionsRepository.find({
      where: {
        accountId,
        idempotencyKey: In(keys) as any,
      },
      order: { timestamp: 'DESC' },
    });
  }
}

// Import the In operator
import { In } from 'typeorm';
