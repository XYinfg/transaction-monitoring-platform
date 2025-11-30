import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { AuditService } from '../audit/audit.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditAction } from '../audit/entities/audit-log.entity';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountsController {
  constructor(
    private accountsService: AccountsService,
    private auditService: AuditService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  async create(@CurrentUser('id') userId: string, @Body() createAccountDto: CreateAccountDto) {
    const account = await this.accountsService.create(userId, createAccountDto);

    await this.auditService.log({
      userId,
      action: AuditAction.ACCOUNT_CREATED,
      resourceType: 'account',
      resourceId: account.id,
      metadata: { accountName: account.name },
    });

    return account;
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts for the current user' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.accountsService.findAll(userId);
  }

  @Get('balance/total')
  @ApiOperation({ summary: 'Get total balance across all accounts' })
  async getTotalBalance(
    @CurrentUser('id') userId: string,
    @Query('currency') currency: string = 'USD',
  ) {
    const total = await this.accountsService.getTotalBalance(userId, currency);
    return { currency, totalBalance: total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.accountsService.findOne(id, userId);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  async getBalance(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const balance = await this.accountsService.getBalance(id, userId);
    return { accountId: id, balance };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const account = await this.accountsService.update(id, userId, updateAccountDto);

    await this.auditService.log({
      userId,
      action: AuditAction.ACCOUNT_UPDATED,
      resourceType: 'account',
      resourceId: id,
      metadata: updateAccountDto,
    });

    return account;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.accountsService.remove(id, userId);

    await this.auditService.log({
      userId,
      action: AuditAction.ACCOUNT_DELETED,
      resourceType: 'account',
      resourceId: id,
    });

    return { message: 'Account deleted successfully' };
  }
}
