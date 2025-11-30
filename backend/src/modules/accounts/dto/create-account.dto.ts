import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Length, IsNumber, Min } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'Main Checking Account' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'USD', description: '3-letter currency code' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({ example: 1000.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ example: 'checking' })
  @IsString()
  @IsOptional()
  accountType?: string;

  @ApiPropertyOptional({ example: 'DBS Bank' })
  @IsString()
  @IsOptional()
  institutionName?: string;

  @ApiPropertyOptional({ example: '****1234' })
  @IsString()
  @IsOptional()
  accountNumber?: string;
}
