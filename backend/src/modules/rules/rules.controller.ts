import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('rules')
@Controller('rules')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class RulesController {
  constructor(private rulesService: RulesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new AML/Fraud detection rule (Admin only)' })
  async create(@Body() createRuleDto: CreateRuleDto) {
    return this.rulesService.create(createRuleDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get all rules (Admin/Analyst only)' })
  async findAll() {
    return this.rulesService.findAll();
  }

  @Get('enabled')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get all enabled rules' })
  async findEnabled() {
    return this.rulesService.findEnabled();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Get rule by ID' })
  async findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update rule (Admin only)' })
  async update(@Param('id') id: string, @Body() updateRuleDto: UpdateRuleDto) {
    return this.rulesService.update(id, updateRuleDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete rule (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.rulesService.remove(id);
    return { message: 'Rule deleted successfully' };
  }

  @Post(':id/enable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enable rule (Admin only)' })
  async enable(@Param('id') id: string) {
    return this.rulesService.enable(id);
  }

  @Post(':id/disable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Disable rule (Admin only)' })
  async disable(@Param('id') id: string) {
    return this.rulesService.disable(id);
  }
}
