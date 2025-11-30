import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('categories')
@Controller('categories')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  // Categories
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAllCategories() {
    return this.categoriesService.findAllCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findCategory(@Param('id') id: string) {
    return this.categoriesService.findCategory(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get category statistics' })
  async getCategoryStatistics(@Param('id') id: string) {
    return this.categoriesService.getCategoryStatistics(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category (Admin only)' })
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  async removeCategory(@Param('id') id: string) {
    await this.categoriesService.removeCategory(id);
    return { message: 'Category deleted successfully' };
  }

  // Categorization Rules
  @Post('rules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create categorization rule (Admin only)' })
  async createRule(@Body() createRuleDto: CreateRuleDto) {
    return this.categoriesService.createRule(createRuleDto);
  }

  @Get('rules/all')
  @ApiOperation({ summary: 'Get all categorization rules' })
  async findAllRules() {
    return this.categoriesService.findAllRules();
  }

  @Get(':categoryId/rules')
  @ApiOperation({ summary: 'Get rules for a category' })
  async findRulesByCategory(@Param('categoryId') categoryId: string) {
    return this.categoriesService.findRulesByCategory(categoryId);
  }

  @Delete('rules/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete categorization rule (Admin only)' })
  async removeRule(@Param('id') id: string) {
    await this.categoriesService.removeRule(id);
    return { message: 'Rule deleted successfully' };
  }

  @Post('categorize/uncategorized')
  @ApiOperation({ summary: 'Categorize all uncategorized transactions' })
  async categorizeUncategorized() {
    const count = await this.categoriesService.categorizeUncategorizedTransactions();
    return { message: `Categorized ${count} transactions` };
  }
}
