import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResolveAlertDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
