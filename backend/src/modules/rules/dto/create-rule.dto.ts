import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsObject, IsBoolean, IsOptional } from 'class-validator';
import { RuleType, RuleSeverity } from '../entities/rule.entity';

export class CreateRuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: RuleType })
  @IsEnum(RuleType)
  type: RuleType;

  @ApiProperty({ enum: RuleSeverity })
  @IsEnum(RuleSeverity)
  severity: RuleSeverity;

  @ApiProperty({
    description: 'JSON condition object',
    example: { multiplier: 3, lookbackDays: 30 },
  })
  @IsObject()
  condition: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  autoResolve?: boolean;
}
