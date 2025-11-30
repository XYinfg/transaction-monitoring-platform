import { Injectable, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import * as Papa from 'papaparse';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionSource } from '../entities/transaction.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CsvImportResult {
  successful: number;
  failed: number;
  total: number;
  transactions: CreateTransactionDto[];
  errors: Array<{ row: number; error: string; data: any }>;
}

@Injectable()
export class CsvImportService {
  async parseCsvFile(
    fileBuffer: Buffer,
    accountId: string,
    columnMapping?: Record<string, string>,
  ): Promise<CsvImportResult> {
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);
    stream.setEncoding('utf8');

    return new Promise((resolve, reject) => {
      const transactions: CreateTransactionDto[] = [];
      const errors: Array<{ row: number; error: string; data: any }> = [];
      let rowIndex = 0;
      let mapping = columnMapping;

      Papa.parse(stream, {
        header: true,
        skipEmptyLines: true,
        step: (results) => {
          const row = results.data;

          // Auto-detect mapping from first row if not provided
          if (rowIndex === 0 && !mapping) {
            mapping = this.getDefaultMapping(row);
          }

          try {
            if (mapping) {
              const transaction = this.mapRowToTransaction(row, accountId, mapping);
              transactions.push(transaction);
            }
          } catch (error) {
            errors.push({
              row: rowIndex + 1,
              error: error.message,
              data: row,
            });
          }
          rowIndex++;
        },
        complete: () => {
          resolve({
            successful: transactions.length,
            failed: errors.length,
            total: rowIndex,
            transactions,
            errors,
          });
        },
        error: (error) => {
          reject(new BadRequestException(`Failed to parse CSV: ${error.message}`));
        },
      });
    });
  }

  private mapRowToTransaction(
    row: any,
    accountId: string,
    mapping: Record<string, string>,
  ): CreateTransactionDto {
    // Extract values using mapping
    const timestamp = this.parseDate(row[mapping.date || 'date'] || row[mapping.timestamp || 'timestamp']);
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

    return {
      accountId,
      timestamp,
      description,
      amount,
      currency,
      merchant,
      referenceNumber,
      source: TransactionSource.CSV_UPLOAD,
      idempotencyKey: uuidv4(),
    };
  }

  private parseDate(dateString: string): Date {
    if (!dateString) {
      throw new Error('Date is required');
    }

    // Try multiple date formats
    const formats = [
      // ISO format
      /^\d{4}-\d{2}-\d{2}/,
      // US format MM/DD/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}/,
      // EU format DD/MM/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}/,
      // DD-MM-YYYY
      /^\d{1,2}-\d{1,2}-\d{4}/,
    ];

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
    const cleaned = amountString
      .toString()
      .replace(/[$£€¥,\s]/g, '')
      .trim();

    // Handle parentheses for negative numbers (common in accounting)
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
    // Auto-detect common column names
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());

    const mapping: Record<string, string> = {};

    // Date/Timestamp
    const dateColumns = ['date', 'timestamp', 'transaction date', 'transaction_date', 'posted date'];
    mapping.date = this.findColumn(headers, dateColumns) || 'date';

    // Description
    const descColumns = ['description', 'desc', 'narrative', 'details', 'transaction description'];
    mapping.description = this.findColumn(headers, descColumns) || 'description';

    // Amount
    const amountColumns = ['amount', 'value', 'transaction amount', 'debit', 'credit'];
    mapping.amount = this.findColumn(headers, amountColumns) || 'amount';

    // Currency
    const currencyColumns = ['currency', 'ccy', 'curr'];
    mapping.currency = this.findColumn(headers, currencyColumns) || 'currency';

    // Merchant
    const merchantColumns = ['merchant', 'vendor', 'payee', 'merchant name'];
    mapping.merchant = this.findColumn(headers, merchantColumns) || 'merchant';

    // Reference
    const refColumns = ['reference', 'ref', 'reference number', 'transaction id', 'transaction_id'];
    mapping.reference = this.findColumn(headers, refColumns) || 'reference';

    return mapping;
  }

  private findColumn(headers: string[], possibleNames: string[]): string | null {
    for (const name of possibleNames) {
      const found = headers.find((h) => h.includes(name));
      if (found) {
        // Return the original header name (not lowercase)
        return Object.keys(headers)[headers.indexOf(found)];
      }
    }
    return null;
  }
}
