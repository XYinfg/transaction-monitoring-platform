import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Rule } from './entities/rule.entity';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { RuleEngineService } from './services/rule-engine.service';
import { RuleProcessor } from './processors/rule.processor';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rule]),
    BullModule.registerQueue({
      name: 'rules',
    }),
    AlertsModule,
  ],
  providers: [RulesService, RuleEngineService, RuleProcessor],
  controllers: [RulesController],
  exports: [RulesService, RuleEngineService],
})
export class RulesModule {}
