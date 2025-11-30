import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Account } from '../../accounts/entities/account.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

export type UserRole = 'user' | 'analyst' | 'admin';
export const UserRole = {
  USER: 'user' as UserRole,
  ANALYST: 'analyst' as UserRole,
  ADMIN: 'admin' as UserRole,
} as const;

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({
    type: 'enum',
    enum: ['user', 'analyst', 'admin'],
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'refresh_token', nullable: true })
  @Exclude()
  refreshToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  // Relations
  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
