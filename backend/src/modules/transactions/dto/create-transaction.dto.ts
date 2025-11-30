import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
  IsEnum,
  IsUUID,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionSource } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  balanceAfter?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  merchant?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  merchantCategory?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsEnum(TransactionSource)
  @IsOptional()
  source?: TransactionSource;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}
