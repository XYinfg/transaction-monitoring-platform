import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TransactionsService } from './transactions.service';
import { CsvImportService } from './services/csv-import.service';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { AuditService } from '../audit/audit.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ImportCsvDto } from './dto/import-csv.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { CsvImportJobData } from './processors/csv-import.processor';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private csvImportService: CsvImportService,
    private accountsService: AccountsService,
    private categoriesService: CategoriesService,
    private auditService: AuditService,
    @InjectQueue('csv-import') private csvImportQueue: Queue<CsvImportJobData>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  async create(@CurrentUser('id') userId: string, @Body() createTransactionDto: CreateTransactionDto) {
    // Verify account ownership
    await this.accountsService.findOne(createTransactionDto.accountId, userId);

    const transaction = await this.transactionsService.create(createTransactionDto);

    // Update account balance
    await this.accountsService.updateBalance(transaction.accountId, transaction.amount as number);

    // Try to categorize
    await this.categoriesService.categorizeTransaction(transaction.id);

    await this.auditService.log({
      userId,
      action: AuditAction.TRANSACTION_CREATED,
      resourceType: 'transaction',
      resourceId: transaction.id,
    });

    return transaction;
  }

  @Post('import/csv')
  @ApiOperation({ summary: 'Import transactions from CSV file (async with job queue)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        accountId: {
          type: 'string',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() importCsvDto: ImportCsvDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Verify account ownership
    await this.accountsService.findOne(importCsvDto.accountId, userId);

    // Enqueue CSV import job
    const job = await this.csvImportQueue.add('import-transactions', {
      fileBuffer: file.buffer,
      accountId: importCsvDto.accountId,
      userId,
      columnMapping: importCsvDto.columnMapping,
    });

    return {
      message: 'CSV import job enqueued successfully',
      jobId: job.id,
      status: await job.getState(),
    };
  }

  @Get('import/status/:jobId')
  @ApiOperation({ summary: 'Get CSV import job status' })
  async getImportStatus(@Param('jobId') jobId: string, @CurrentUser('id') userId: string) {
    const job = await this.csvImportQueue.getJob(jobId);

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    // Verify user owns the account for this job
    const jobData = job.data as CsvImportJobData;
    if (jobData.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;

    return {
      jobId: job.id,
      status: state,
      progress,
      result,
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
    };
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get all transactions for an account' })
  async findAllForAccount(
    @Param('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    // Verify account ownership
    await this.accountsService.findOne(accountId, userId);

    return this.transactionsService.findAll(accountId, paginationDto);
  }

  @Get('account/:accountId/statistics')
  @ApiOperation({ summary: 'Get transaction statistics for an account' })
  async getStatistics(
    @Param('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Verify account ownership
    await this.accountsService.findOne(accountId, userId);

    return this.transactionsService.getStatistics(
      accountId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('account/:accountId/by-category')
  @ApiOperation({ summary: 'Get transactions grouped by category' })
  async getByCategory(
    @Param('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Verify account ownership
    await this.accountsService.findOne(accountId, userId);

    return this.transactionsService.getTransactionsByCategory(
      accountId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const transaction = await this.transactionsService.findOne(id);

    // Verify account ownership
    await this.accountsService.findOne(transaction.accountId, userId);

    return transaction;
  }
}
