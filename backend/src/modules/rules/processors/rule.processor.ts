import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { RuleEngineService } from '../services/rule-engine.service';

@Processor('rules')
export class RuleProcessor {
  constructor(private ruleEngineService: RuleEngineService) {}

  @Process('evaluate-transaction')
  async handleTransactionEvaluation(job: Job) {
    const { transactionId } = job.data;
    await this.ruleEngineService.evaluateTransaction(transactionId);
  }

  @Process('evaluate-account')
  async handleAccountEvaluation(job: Job) {
    const { accountId } = job.data;
    await this.ruleEngineService.runRulesForAccount(accountId);
  }
}
