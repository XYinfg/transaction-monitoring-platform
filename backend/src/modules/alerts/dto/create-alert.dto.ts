import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
