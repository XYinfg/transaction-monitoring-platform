import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { CsvImportService } from './services/csv-import.service';
import { CsvImportProcessor } from './processors/csv-import.processor';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    BullModule.registerQueue({
      name: 'csv-import',
    }),
    AccountsModule,
    CategoriesModule,
    AuditModule,
  ],
  providers: [TransactionsService, CsvImportService, CsvImportProcessor],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
