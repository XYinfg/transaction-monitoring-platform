import { DataSource } from 'typeorm';
import { Rule, RuleType, RuleSeverity } from '../../modules/rules/entities/rule.entity';

export async function seedRules(dataSource: DataSource) {
  const ruleRepo = dataSource.getRepository(Rule);

  console.log('🚨 Seeding AML/Fraud detection rules...');

  const rules = [
    {
      name: 'Large Transaction Alert',
      description: 'Triggers when a single transaction exceeds 3x the user average',
      type: RuleType.LARGE_TRANSACTION,
      severity: RuleSeverity.HIGH,
      condition: {
        type: 'large_transaction',
        multiplier: 3,
        lookbackDays: 30,
      },
    },
    {
      name: 'High Velocity - Multiple Transactions',
      description: 'Triggers when more than 10 transactions occur within 1 hour',
      type: RuleType.VELOCITY,
      severity: RuleSeverity.MEDIUM,
      condition: {
        type: 'velocity',
        count: 10,
        windowMinutes: 60,
      },
    },
    {
      name: 'Potential Structuring Pattern',
      description: 'Detects multiple transactions just below reporting threshold',
      type: RuleType.STRUCTURING,
      severity: RuleSeverity.CRITICAL,
      condition: {
        type: 'structuring',
        threshold: 10000,
        tolerance: 0.1,
        count: 3,
        windowHours: 24,
      },
    },
    {
      name: 'Unusual Spending Pattern',
      description: 'Detects significant deviation from normal spending patterns',
      type: RuleType.UNUSUAL_PATTERN,
      severity: RuleSeverity.MEDIUM,
      condition: {
        type: 'unusual_pattern',
        stdDevMultiplier: 2.5,
        lookbackDays: 90,
      },
    },
    {
      name: 'High-Risk Merchant Category',
      description: 'Flags transactions from high-risk merchant categories',
      type: RuleType.CUSTOM,
      severity: RuleSeverity.LOW,
      condition: {
        type: 'merchant_category',
        categories: ['gambling', 'cryptocurrency', 'money_transfer'],
      },
    },
    {
      name: 'Rapid Depletion Alert',
      description: 'Triggers when account balance drops by 50% or more in 24 hours',
      type: RuleType.UNUSUAL_PATTERN,
      severity: RuleSeverity.HIGH,
      condition: {
        type: 'rapid_depletion',
        percentageThreshold: 50,
        windowHours: 24,
      },
    },
  ];

  for (const ruleData of rules) {
    const existing = await ruleRepo.findOne({ where: { name: ruleData.name } });

    if (!existing) {
      const rule = ruleRepo.create(ruleData);
      await ruleRepo.save(rule);
      console.log(`  ✓ Created rule: ${ruleData.name}`);
    } else {
      console.log(`  - Rule already exists: ${ruleData.name}`);
    }
  }

  console.log('✅ AML/Fraud rules seeded successfully');
}
