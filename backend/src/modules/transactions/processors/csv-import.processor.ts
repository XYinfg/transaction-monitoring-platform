import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Readable } from 'stream';
import * as Papa from 'papaparse';
import { Transaction, TransactionSource } from '../entities/transaction.entity';
import { CategoriesService } from '../../categories/categories.service';
import { AccountsService } from '../../accounts/accounts.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CsvImportJobData {
  fileBuffer: Buffer;
  accountId: string;
  userId: string;
  columnMapping?: Record<string, string>;
}

export interface CsvImportJobResult {
  successful: number;
  failed: number;
  total: number;
  errors: Array<{ row: number; error: string }>;
}

@Processor('csv-import')
export class CsvImportProcessor {
  private readonly logger = new Logger(CsvImportProcessor.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private categoriesService: CategoriesService,
    private accountsService: AccountsService,
    private auditService: AuditService,
  ) { }

  @Process('import-transactions')
  async handleCsvImport(job: Job<CsvImportJobData>): Promise<CsvImportJobResult> {
    const { fileBuffer, accountId, userId, columnMapping } = job.data;

    this.logger.log(`Starting CSV import for account ${accountId}`);

    const result: CsvImportJobResult = {
      successful: 0,
      failed: 0,
      total: 0,
      errors: [],
    };

    let totalAmount = 0;

    try {
      // Convert buffer to readable stream
      const stream = Readable.from(fileBuffer);

      // Process CSV with streaming
      totalAmount = await this.processStreamingCsv(stream, accountId, columnMapping, result, job);

      // Update account balance
      if (result.successful > 0 && totalAmount !== 0) {
        await this.accountsService.updateBalance(accountId, totalAmount);
      }

      // Log audit
      await this.auditService.log({
        userId,
        action: AuditAction.TRANSACTION_IMPORTED,
        resourceType: 'transaction',
        metadata: {
          accountId,
          successful: result.successful,
          failed: result.failed,
          total: result.total,
        },
      });

      this.logger.log(`CSV import completed: ${result.successful} successful, ${result.failed} failed`);

      return result;
    } catch (error) {
      this.logger.error(`CSV import failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async processStreamingCsv(
    stream: Readable,
    accountId: string,
    columnMapping: Record<string, string> | undefined,
    result: CsvImportJobResult,
    job: Job,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const batchSize = 100;
      let batch: any[] = [];
      let rowIndex = 0;
      let mapping: Record<string, string> | undefined = columnMapping;
      let totalAmount = 0;

      Papa.parse(stream, {
        header: true,
        skipEmptyLines: true,
        step: async (row, parser) => {
          // Pause parsing while we process this batch
          parser.pause();

          try {
            // Auto-detect column mapping from first row
            if (rowIndex === 0 && !mapping) {
              mapping = this.getDefaultMapping(row.data);
            }

            batch.push({ data: row.data, index: rowIndex });
            rowIndex++;
            result.total++;

            // Update job progress
            await job.progress({
              processed: rowIndex,
              successful: result.successful,
              failed: result.failed,
            });

            // Process batch when it reaches batch size
            if (batch.length >= batchSize) {
              const batchTotal = await this.processBatch(batch, accountId, mapping!, result);
              totalAmount += batchTotal;
              batch = [];
            }

            parser.resume();
          } catch (error) {
            this.logger.error(`Error processing row ${rowIndex}: ${error.message}`);
            result.failed++;
            result.errors.push({
              row: rowIndex,
              error: error.message,
            });
            parser.resume();
          }
        },
        complete: async () => {
          try {
            // Process remaining batch
            if (batch.length > 0) {
              const batchTotal = await this.processBatch(batch, accountId, mapping!, result);
              totalAmount += batchTotal;
            }
            resolve(totalAmount);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          this.logger.error(`CSV parsing error: ${error.message}`);
          reject(error);
        },
      });
    });
  }

  private async processBatch(
    batch: Array<{ data: any; index: number }>,
    accountId: string,
    mapping: Record<string, string>,
    result: CsvImportJobResult,
  ): Promise<number> {
    const transactionRepo = this.dataSource.getRepository(Transaction);
    const transactionsToSave: Transaction[] = [];
    let batchTotal = 0;

    for (const { data, index } of batch) {
      try {
        const transaction = this.mapRowToTransaction(data, accountId, mapping);
        transactionsToSave.push(transaction);
        batchTotal += transaction.amount as number;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: index + 1,
          error: error.message,
        });
      }
    }

    if (transactionsToSave.length > 0) {
      try {
        // Use upsert to handle duplicate idempotency keys
        await transactionRepo
          .createQueryBuilder()
          .insert()
          .into(Transaction)
          .values(transactionsToSave)
          .orIgnore() // Ignore duplicates based on unique constraints
          .execute();

        result.successful += transactionsToSave.length;

        // Categorize transactions asynchronously (don't wait)
        Promise.all(
          transactionsToSave.map((t) =>
            this.categoriesService.categorizeTransaction(t.id).catch((err) => {
              this.logger.warn(`Failed to categorize transaction ${t.id}: ${err.message}`);
            }),
          ),
        );
      } catch (error) {
        this.logger.error(`Batch insert failed: ${error.message}`);
        result.failed += transactionsToSave.length;
        batchTotal = 0; // Don't count failed transactions
      }
    }

    return batchTotal;
  }

  private mapRowToTransaction(
    row: any,
    accountId: string,
    mapping: Record<string, string>,
  ): Transaction {
    const timestamp = this.parseDate(
      row[mapping.date || 'date'] || row[mapping.timestamp || 'timestamp'],
    );
    const description = row[mapping.description || 'description'];
    const amount = this.parseAmount(row[mapping.amount || 'amount']);
    const currency = row[mapping.currency || 'currency'] || 'USD';
    const merchant = row[mapping.merchant || 'merchant'] || null;
    const referenceNumber = row[mapping.reference || 'reference'] || null;

    if (!description) {
      throw new Error('Description is required');
    }

    if (amount === null || isNaN(amount)) {
      throw new Error('Invalid amount');
    }

    if (!timestamp) {
      throw new Error('Invalid or missing date');
    }

    const transaction = new Transaction();
    transaction.accountId = accountId;
    transaction.timestamp = timestamp;
    transaction.description = description;
    transaction.amount = amount;
    transaction.currency = currency;
    transaction.merchant = merchant;
    transaction.referenceNumber = referenceNumber;
    transaction.source = TransactionSource.CSV_UPLOAD;
    transaction.idempotencyKey = referenceNumber || uuidv4();

    return transaction;
  }

  private parseDate(dateString: string): Date {
    if (!dateString) {
      throw new Error('Date is required');
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    return date;
  }

  private parseAmount(amountString: string): number {
    if (!amountString) {
      throw new Error('Amount is required');
    }

    // Remove currency symbols and commas
    const cleaned = amountString.toString().replace(/[$£€¥,\s]/g, '').trim();

    // Handle parentheses for negative numbers
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      return -parseFloat(cleaned.slice(1, -1));
    }

    const amount = parseFloat(cleaned);

    if (isNaN(amount)) {
      throw new Error(`Invalid amount: ${amountString}`);
    }

    return amount;
  }

  private getDefaultMapping(firstRow: any): Record<string, string> {
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());
    const mapping: Record<string, string> = {};

    // Date/Timestamp
    const dateColumns = ['date', 'timestamp', 'transaction date', 'transaction_date', 'posted date'];
    mapping.date = this.findColumn(headers, dateColumns, firstRow) || 'date';

    // Description
    const descColumns = ['description', 'desc', 'narrative', 'details', 'transaction description'];
    mapping.description = this.findColumn(headers, descColumns, firstRow) || 'description';

    // Amount
    const amountColumns = ['amount', 'value', 'transaction amount', 'debit', 'credit'];
    mapping.amount = this.findColumn(headers, amountColumns, firstRow) || 'amount';

    // Currency
    const currencyColumns = ['currency', 'ccy', 'curr'];
    mapping.currency = this.findColumn(headers, currencyColumns, firstRow) || 'currency';

    // Merchant
    const merchantColumns = ['merchant', 'vendor', 'payee', 'merchant name'];
    mapping.merchant = this.findColumn(headers, merchantColumns, firstRow) || 'merchant';

    // Reference
    const refColumns = ['reference', 'ref', 'reference number', 'transaction id', 'transaction_id'];
    mapping.reference = this.findColumn(headers, refColumns, firstRow) || 'reference';

    return mapping;
  }

  private findColumn(headers: string[], possibleNames: string[], firstRow: any): string | null {
    for (const name of possibleNames) {
      const found = headers.find((h) => h.includes(name));
      if (found) {
        // Return the original header name (not lowercase)
        const originalKeys = Object.keys(firstRow);
        const originalKey = originalKeys.find(
          (k) => k.toLowerCase() === found,
        );
        return originalKey || null;
      }
    }
    return null;
  }
}

