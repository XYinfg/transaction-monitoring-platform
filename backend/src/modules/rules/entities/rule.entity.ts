import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Alert } from '../../alerts/entities/alert.entity';

export type RuleSeverity = 'low' | 'medium' | 'high' | 'critical';
export const RuleSeverity = {
  LOW: 'low' as RuleSeverity,
  MEDIUM: 'medium' as RuleSeverity,
  HIGH: 'high' as RuleSeverity,
  CRITICAL: 'critical' as RuleSeverity,
} as const;

export type RuleType = 'large_transaction' | 'velocity' | 'structuring' | 'unusual_pattern' | 'foreign_transaction' | 'custom';
export const RuleType = {
  LARGE_TRANSACTION: 'large_transaction' as RuleType,
  VELOCITY: 'velocity' as RuleType,
  STRUCTURING: 'structuring' as RuleType,
  UNUSUAL_PATTERN: 'unusual_pattern' as RuleType,
  FOREIGN_TRANSACTION: 'foreign_transaction' as RuleType,
  CUSTOM: 'custom' as RuleType,
} as const;

@Entity('rules')
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['large_transaction', 'velocity', 'structuring', 'unusual_pattern', 'foreign_transaction', 'custom'],
    default: RuleType.CUSTOM,
  })
  type: RuleType;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: RuleSeverity.MEDIUM,
  })
  severity: RuleSeverity;

  @Column({ type: 'jsonb' })
  condition: Record<string, any>; // Flexible JSON condition

  @Column({ default: true })
  enabled: boolean;

  @Column({ name: 'auto_resolve', default: false })
  autoResolve: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Alert, (alert) => alert.rule)
  alerts: Alert[];
}
