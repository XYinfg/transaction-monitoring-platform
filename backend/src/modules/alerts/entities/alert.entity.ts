import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Rule } from '../../rules/entities/rule.entity';

export type AlertStatus = 'open' | 'reviewing' | 'resolved' | 'false_positive' | 'escalated';
export const AlertStatus = {
  OPEN: 'open' as AlertStatus,
  REVIEWING: 'reviewing' as AlertStatus,
  RESOLVED: 'resolved' as AlertStatus,
  FALSE_POSITIVE: 'false_positive' as AlertStatus,
  ESCALATED: 'escalated' as AlertStatus,
} as const;

@Entity('alerts')
@Index(['userId', 'status'])
@Index(['ruleId', 'createdAt'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ name: 'rule_id' })
  ruleId: string;

  @Column({
    type: 'enum',
    enum: ['open', 'reviewing', 'resolved', 'false_positive', 'escalated'],
    default: AlertStatus.OPEN,
  })
  status: AlertStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>; // Additional context about the alert

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo: string; // Analyst user ID

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy: string; // User ID who resolved it

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @ManyToOne(() => Rule)
  @JoinColumn({ name: 'rule_id' })
  rule: Rule;
}
