import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type AuditAction =
  // Auth
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'register'
  | 'password_changed'
  // Account
  | 'account_created'
  | 'account_updated'
  | 'account_deleted'
  // Transaction
  | 'transaction_created'
  | 'transaction_imported'
  | 'transaction_updated'
  // Rules
  | 'rule_created'
  | 'rule_updated'
  | 'rule_deleted'
  | 'rule_enabled'
  | 'rule_disabled'
  // Alerts
  | 'alert_created'
  | 'alert_reviewed'
  | 'alert_resolved'
  | 'alert_escalated'
  // Admin
  | 'user_role_changed'
  | 'user_deactivated';

export const AuditAction = {
  // Auth
  LOGIN_SUCCESS: 'login_success' as AuditAction,
  LOGIN_FAILED: 'login_failed' as AuditAction,
  LOGOUT: 'logout' as AuditAction,
  REGISTER: 'register' as AuditAction,
  PASSWORD_CHANGED: 'password_changed' as AuditAction,
  // Account
  ACCOUNT_CREATED: 'account_created' as AuditAction,
  ACCOUNT_UPDATED: 'account_updated' as AuditAction,
  ACCOUNT_DELETED: 'account_deleted' as AuditAction,
  // Transaction
  TRANSACTION_CREATED: 'transaction_created' as AuditAction,
  TRANSACTION_IMPORTED: 'transaction_imported' as AuditAction,
  TRANSACTION_UPDATED: 'transaction_updated' as AuditAction,
  // Rules
  RULE_CREATED: 'rule_created' as AuditAction,
  RULE_UPDATED: 'rule_updated' as AuditAction,
  RULE_DELETED: 'rule_deleted' as AuditAction,
  RULE_ENABLED: 'rule_enabled' as AuditAction,
  RULE_DISABLED: 'rule_disabled' as AuditAction,
  // Alerts
  ALERT_CREATED: 'alert_created' as AuditAction,
  ALERT_REVIEWED: 'alert_reviewed' as AuditAction,
  ALERT_RESOLVED: 'alert_resolved' as AuditAction,
  ALERT_ESCALATED: 'alert_escalated' as AuditAction,
  // Admin
  USER_ROLE_CHANGED: 'user_role_changed' as AuditAction,
  USER_DEACTIVATED: 'user_deactivated' as AuditAction,
} as const;

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: [
      'login_success', 'login_failed', 'logout', 'register', 'password_changed',
      'account_created', 'account_updated', 'account_deleted',
      'transaction_created', 'transaction_imported', 'transaction_updated',
      'rule_created', 'rule_updated', 'rule_deleted', 'rule_enabled', 'rule_disabled',
      'alert_created', 'alert_reviewed', 'alert_resolved', 'alert_escalated',
      'user_role_changed', 'user_deactivated'
    ],
  })
  action: AuditAction;

  @Column({ name: 'resource_type', nullable: true })
  resourceType: string; // e.g., 'account', 'transaction', 'rule'

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
