import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertStatus } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertsRepository.create(createAlertDto);
    return this.alertsRepository.save(alert);
  }

  async findAll(paginationDto: PaginationDto, status?: AlertStatus): Promise<PaginatedResponse<Alert>> {
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [data, total] = await this.alertsRepository.findAndCount({
      where: query,
      relations: ['user', 'transaction', 'rule'],
      order: { createdAt: 'DESC' },
      skip: paginationDto.skip,
      take: paginationDto.limit,
    });

    return new PaginatedResponse(data, total, paginationDto.page, paginationDto.limit);
  }

  async findByUser(userId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Alert>> {
    const [data, total] = await this.alertsRepository.findAndCount({
      where: { userId },
      relations: ['transaction', 'rule'],
      order: { createdAt: 'DESC' },
      skip: paginationDto.skip,
      take: paginationDto.limit,
    });

    return new PaginatedResponse(data, total, paginationDto.page, paginationDto.limit);
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertsRepository.findOne({
      where: { id },
      relations: ['user', 'transaction', 'transaction.account', 'rule'],
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  async update(id: string, updateAlertDto: UpdateAlertDto, analystId?: string): Promise<Alert> {
    const alert = await this.findOne(id);

    Object.assign(alert, updateAlertDto);

    if (analystId && updateAlertDto.status === AlertStatus.REVIEWING) {
      alert.assignedTo = analystId;
    }

    if (
      updateAlertDto.status === AlertStatus.RESOLVED ||
      updateAlertDto.status === AlertStatus.FALSE_POSITIVE
    ) {
      alert.resolvedAt = new Date();
      if (analystId) {
        alert.resolvedBy = analystId;
      }
    }

    return this.alertsRepository.save(alert);
  }

  async assignToAnalyst(alertId: string, analystId: string): Promise<Alert> {
    const alert = await this.findOne(alertId);

    alert.assignedTo = analystId;
    alert.status = AlertStatus.REVIEWING;

    return this.alertsRepository.save(alert);
  }

  async resolve(alertId: string, analystId: string, notes?: string): Promise<Alert> {
    const alert = await this.findOne(alertId);

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolvedBy = analystId;

    if (notes) {
      alert.notes = notes;
    }

    return this.alertsRepository.save(alert);
  }

  async markAsFalsePositive(alertId: string, analystId: string, notes?: string): Promise<Alert> {
    const alert = await this.findOne(alertId);

    alert.status = AlertStatus.FALSE_POSITIVE;
    alert.resolvedAt = new Date();
    alert.resolvedBy = analystId;

    if (notes) {
      alert.notes = notes;
    }

    return this.alertsRepository.save(alert);
  }

  async escalate(alertId: string, analystId: string, notes?: string): Promise<Alert> {
    const alert = await this.findOne(alertId);

    alert.status = AlertStatus.ESCALATED;

    if (notes) {
      alert.notes = notes;
    }

    return this.alertsRepository.save(alert);
  }

  async getStatistics() {
    const total = await this.alertsRepository.count();
    const open = await this.alertsRepository.count({ where: { status: AlertStatus.OPEN } });
    const reviewing = await this.alertsRepository.count({ where: { status: AlertStatus.REVIEWING } });
    const resolved = await this.alertsRepository.count({ where: { status: AlertStatus.RESOLVED } });
    const falsePositive = await this.alertsRepository.count({
      where: { status: AlertStatus.FALSE_POSITIVE },
    });
    const escalated = await this.alertsRepository.count({ where: { status: AlertStatus.ESCALATED } });

    return {
      total,
      open,
      reviewing,
      resolved,
      falsePositive,
      escalated,
    };
  }

  async getAlertsByRule(ruleId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Alert>> {
    const [data, total] = await this.alertsRepository.findAndCount({
      where: { ruleId },
      relations: ['user', 'transaction'],
      order: { createdAt: 'DESC' },
      skip: paginationDto.skip,
      take: paginationDto.limit,
    });

    return new PaginatedResponse(data, total, paginationDto.page, paginationDto.limit);
  }
}
