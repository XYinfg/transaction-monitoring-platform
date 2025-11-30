import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { AuditAction } from './entities/audit-log.entity';

@ApiTags('audit')
@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get all audit logs (Admin/Analyst only)' })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.auditService.findAll(paginationDto);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  async findByUser(@Param('userId') userId: string, @Query() paginationDto: PaginationDto) {
    return this.auditService.findByUser(userId, paginationDto);
  }

  @Get('action/:action')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit logs by action type' })
  async findByAction(@Param('action') action: AuditAction, @Query() paginationDto: PaginationDto) {
    return this.auditService.findByAction(action, paginationDto);
  }
}
