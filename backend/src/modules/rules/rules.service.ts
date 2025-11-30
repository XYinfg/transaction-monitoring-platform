import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rule, RuleType, RuleSeverity } from './entities/rule.entity';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(Rule)
    private rulesRepository: Repository<Rule>,
  ) {}

  async create(createRuleDto: CreateRuleDto): Promise<Rule> {
    const rule = this.rulesRepository.create(createRuleDto);
    return this.rulesRepository.save(rule);
  }

  async findAll(): Promise<Rule[]> {
    return this.rulesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findEnabled(): Promise<Rule[]> {
    return this.rulesRepository.find({
      where: { enabled: true },
      order: { severity: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Rule> {
    const rule = await this.rulesRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }
    return rule;
  }

  async update(id: string, updateRuleDto: UpdateRuleDto): Promise<Rule> {
    const rule = await this.findOne(id);
    Object.assign(rule, updateRuleDto);
    return this.rulesRepository.save(rule);
  }

  async remove(id: string): Promise<void> {
    const result = await this.rulesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }
  }

  async enable(id: string): Promise<Rule> {
    const rule = await this.findOne(id);
    rule.enabled = true;
    return this.rulesRepository.save(rule);
  }

  async disable(id: string): Promise<Rule> {
    const rule = await this.findOne(id);
    rule.enabled = false;
    return this.rulesRepository.save(rule);
  }
}
