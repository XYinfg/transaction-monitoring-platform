import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { MoneyUtil } from '../../common/utils/money.util';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async create(userId: string, createAccountDto: CreateAccountDto): Promise<Account> {
    const account = this.accountsRepository.create({
      ...createAccountDto,
      userId,
    });

    return this.accountsRepository.save(account);
  }

  async findAll(userId: string): Promise<Account[]> {
    return this.accountsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    // Verify ownership if userId is provided
    if (userId && account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }

    return account;
  }

  async update(id: string, userId: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id, userId);

    Object.assign(account, updateAccountDto);

    return this.accountsRepository.save(account);
  }

  async remove(id: string, userId: string): Promise<void> {
    const account = await this.findOne(id, userId);

    await this.accountsRepository.remove(account);
  }

  async updateBalance(accountId: string, amount: number): Promise<Account> {
    const account = await this.findOne(accountId);

    const newBalance = MoneyUtil.add(account.balance as number, amount);
    account.balance = newBalance;

    return this.accountsRepository.save(account);
  }

  async getBalance(accountId: string, userId?: string): Promise<number> {
    const account = await this.findOne(accountId, userId);
    return account.balance as number;
  }

  async getTotalBalance(userId: string, currency: string = 'USD'): Promise<number> {
    const accounts = await this.findAll(userId);

    const accountsInCurrency = accounts.filter((acc) => acc.currency === currency);

    return accountsInCurrency.reduce(
      (total, account) => MoneyUtil.add(total, account.balance as number),
      0,
    );
  }
}
