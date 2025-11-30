import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<AuditLog>> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: paginationDto.skip,
      take: paginationDto.limit,
    });

    return new PaginatedResponse(data, total, paginationDto.page, paginationDto.limit);
  }

  async findByUser(userId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<AuditLog>> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: paginationDto.skip,
      take: paginationDto.limit,
    });

    return new PaginatedResponse(data, total, paginationDto.page, paginationDto.limit);
  }

  async findByAction(action: AuditAction, paginationDto: PaginationDto): Promise<PaginatedResponse<AuditLog>> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { action },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: paginationDto.skip,
      take: paginationDto.limit,
    });

    return new PaginatedResponse(data, total, paginationDto.page, paginationDto.limit);
  }
}
