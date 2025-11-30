import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get spending summary for date range' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSpendingSummary(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getSpendingSummary(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get spending breakdown by category' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getCategoryBreakdown(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getCategoryBreakdown(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('cashflow')
  @ApiOperation({ summary: 'Get cashflow data over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  async getCashflowData(
    @CurrentUser('id') userId: string,
    @Query('days') days?: number,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.analyticsService.getCashflowData(
      userId,
      days ? parseInt(days.toString()) : 30,
      groupBy || 'day',
    );
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get spending trends by month' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  async getSpendingTrends(
    @CurrentUser('id') userId: string,
    @Query('months') months?: number,
  ) {
    return this.analyticsService.getSpendingTrends(
      userId,
      months ? parseInt(months.toString()) : 6,
    );
  }

  @Get('top-merchants')
  @ApiOperation({ summary: 'Get top merchants by spending' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getTopMerchants(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTopMerchants(
      userId,
      limit ? parseInt(limit.toString()) : 10,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
