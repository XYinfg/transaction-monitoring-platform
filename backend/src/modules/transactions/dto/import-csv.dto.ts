import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class ImportCsvDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({
    description: 'Custom column mapping for CSV fields',
    example: {
      date: 'Transaction Date',
      description: 'Description',
      amount: 'Amount',
    },
  })
  @IsObject()
  @IsOptional()
  columnMapping?: Record<string, string>;
}
