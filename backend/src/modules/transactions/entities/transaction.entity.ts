import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Category } from '../../categories/entities/category.entity';
import { Alert } from '../../alerts/entities/alert.entity';

export type TransactionSource = 'csv_upload' | 'manual' | 'api' | 'synthetic';
export const TransactionSource = {
  CSV_UPLOAD: 'csv_upload' as TransactionSource,
  MANUAL: 'manual' as TransactionSource,
  API: 'api' as TransactionSource,
  SYNTHETIC: 'synthetic' as TransactionSource,
} as const;

@Entity('transactions')
@Index(['accountId', 'timestamp'])
@Index(['accountId', 'category'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ name: 'balance_after', type: 'decimal', precision: 15, scale: 2, nullable: true })
  balanceAfter: number;

  @Column({ nullable: true })
  merchant: string;

  @Column({ name: 'merchant_category', nullable: true })
  merchantCategory: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column({
    type: 'enum',
    enum: ['csv_upload', 'manual', 'api', 'synthetic'],
    default: TransactionSource.CSV_UPLOAD,
  })
  source: TransactionSource;

  @Column({ name: 'reference_number', nullable: true, unique: true })
  referenceNumber: string;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Alert, (alert) => alert.transaction)
  alerts: Alert[];

  get isDebit(): boolean {
    return this.amount < 0;
  }

  get isCredit(): boolean {
    return this.amount > 0;
  }
}
