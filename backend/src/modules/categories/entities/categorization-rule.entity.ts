import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

export type RuleMatchType = 'contains' | 'starts_with' | 'ends_with' | 'exact' | 'regex';
export const RuleMatchType = {
  CONTAINS: 'contains' as RuleMatchType,
  STARTS_WITH: 'starts_with' as RuleMatchType,
  ENDS_WITH: 'ends_with' as RuleMatchType,
  EXACT: 'exact' as RuleMatchType,
  REGEX: 'regex' as RuleMatchType,
} as const;

@Entity('categorization_rules')
export class CategorizationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column()
  pattern: string;

  @Column({
    type: 'enum',
    enum: ['contains', 'starts_with', 'ends_with', 'exact', 'regex'],
    default: RuleMatchType.CONTAINS,
  })
  matchType: RuleMatchType;

  @Column({ name: 'case_sensitive', default: false })
  caseSensitive: boolean;

  @Column({ default: 0 })
  priority: number; // Higher priority rules are checked first

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
