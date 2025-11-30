import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { RuleMatchType } from '../entities/categorization-rule.entity';

export class CreateRuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pattern: string;

  @ApiProperty({ enum: RuleMatchType })
  @IsEnum(RuleMatchType)
  matchType: RuleMatchType;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  caseSensitive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
