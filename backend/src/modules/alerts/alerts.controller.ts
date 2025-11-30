import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AuditService } from '../audit/audit.service';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { AlertStatus } from './entities/alert.entity';
import { AuditAction } from '../audit/entities/audit-log.entity';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(
    private alertsService: AlertsService,
    private auditService: AuditService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get all alerts (Admin/Analyst only)' })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  async findAll(@Query() paginationDto: PaginationDto, @Query('status') status?: AlertStatus) {
    return this.alertsService.findAll(paginationDto, status);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get alert statistics' })
  async getStatistics() {
    return this.alertsService.getStatistics();
  }

  @Get('my-alerts')
  @ApiOperation({ summary: 'Get alerts for current user' })
  async getMyAlerts(@CurrentUser('id') userId: string, @Query() paginationDto: PaginationDto) {
    return this.alertsService.findByUser(userId, paginationDto);
  }

  @Get('rule/:ruleId')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get alerts by rule ID' })
  async getAlertsByRule(@Param('ruleId') ruleId: string, @Query() paginationDto: PaginationDto) {
    return this.alertsService.getAlertsByRule(ruleId, paginationDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get alert by ID' })
  async findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Update alert' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') analystId: string,
    @Body() updateAlertDto: UpdateAlertDto,
  ) {
    const alert = await this.alertsService.update(id, updateAlertDto, analystId);

    await this.auditService.log({
      userId: analystId,
      action: AuditAction.ALERT_REVIEWED,
      resourceType: 'alert',
      resourceId: id,
      metadata: updateAlertDto,
    });

    return alert;
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Assign alert to analyst' })
  async assign(@Param('id') id: string, @CurrentUser('id') analystId: string) {
    return this.alertsService.assignToAnalyst(id, analystId);
  }

  @Post(':id/resolve')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Resolve alert' })
  async resolve(
    @Param('id') id: string,
    @CurrentUser('id') analystId: string,
    @Body() resolveDto: ResolveAlertDto,
  ) {
    const alert = await this.alertsService.resolve(id, analystId, resolveDto.notes);

    await this.auditService.log({
      userId: analystId,
      action: AuditAction.ALERT_RESOLVED,
      resourceType: 'alert',
      resourceId: id,
      metadata: { notes: resolveDto.notes },
    });

    return alert;
  }

  @Post(':id/false-positive')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Mark alert as false positive' })
  async markAsFalsePositive(
    @Param('id') id: string,
    @CurrentUser('id') analystId: string,
    @Body() resolveDto: ResolveAlertDto,
  ) {
    return this.alertsService.markAsFalsePositive(id, analystId, resolveDto.notes);
  }

  @Post(':id/escalate')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Escalate alert' })
  async escalate(
    @Param('id') id: string,
    @CurrentUser('id') analystId: string,
    @Body() resolveDto: ResolveAlertDto,
  ) {
    const alert = await this.alertsService.escalate(id, analystId, resolveDto.notes);

    await this.auditService.log({
      userId: analystId,
      action: AuditAction.ALERT_ESCALATED,
      resourceType: 'alert',
      resourceId: id,
      metadata: { notes: resolveDto.notes },
    });

    return alert;
  }
}
