import { DataSource } from 'typeorm';
import { Category } from '../../modules/categories/entities/category.entity';
import { CategorizationRule, RuleMatchType } from '../../modules/categories/entities/categorization-rule.entity';

export async function seedCategories(dataSource: DataSource) {
  const categoryRepo = dataSource.getRepository(Category);
  const ruleRepo = dataSource.getRepository(CategorizationRule);

  console.log('📦 Seeding categories...');

  const categories = [
    { name: 'Income', description: 'Salary, freelance, and other income', icon: '💰', color: '#10B981' },
    { name: 'Food & Dining', description: 'Restaurants, groceries, and food delivery', icon: '🍔', color: '#F59E0B' },
    { name: 'Transportation', description: 'Public transport, gas, parking', icon: '🚗', color: '#3B82F6' },
    { name: 'Shopping', description: 'Retail, online shopping, clothing', icon: '🛍️', color: '#EC4899' },
    { name: 'Entertainment', description: 'Movies, games, streaming services', icon: '🎬', color: '#8B5CF6' },
    { name: 'Bills & Utilities', description: 'Rent, electricity, internet, phone', icon: '📱', color: '#EF4444' },
    { name: 'Healthcare', description: 'Medical, dental, pharmacy', icon: '⚕️', color: '#06B6D4' },
    { name: 'Travel', description: 'Flights, hotels, vacation expenses', icon: '✈️', color: '#14B8A6' },
    { name: 'Education', description: 'Tuition, books, courses', icon: '📚', color: '#A855F7' },
    { name: 'Investments', description: 'Stocks, crypto, savings', icon: '📈', color: '#059669' },
    { name: 'Insurance', description: 'Health, car, life insurance', icon: '🛡️', color: '#6366F1' },
    { name: 'Personal Care', description: 'Salon, spa, gym membership', icon: '💅', color: '#F472B6' },
    { name: 'Gifts & Donations', description: 'Charity, gifts, contributions', icon: '🎁', color: '#EAB308' },
    { name: 'Fees & Charges', description: 'Bank fees, service charges', icon: '💸', color: '#DC2626' },
    { name: 'Other', description: 'Uncategorized transactions', icon: '📋', color: '#6B7280' },
  ];

  const savedCategories: Record<string, Category> = {};

  for (const cat of categories) {
    const existing = await categoryRepo.findOne({ where: { name: cat.name } });
    if (!existing) {
      const category = categoryRepo.create(cat);
      const saved = await categoryRepo.save(category);
      savedCategories[cat.name] = saved;
      console.log(`  ✓ Created category: ${cat.name}`);
    } else {
      savedCategories[cat.name] = existing;
      console.log(`  - Category already exists: ${cat.name}`);
    }
  }

  // Create categorization rules
  console.log('📋 Creating categorization rules...');

  const rules = [
    // Income
    { category: 'Income', pattern: 'salary', matchType: RuleMatchType.CONTAINS, priority: 10 },
    { category: 'Income', pattern: 'payroll', matchType: RuleMatchType.CONTAINS, priority: 10 },
    { category: 'Income', pattern: 'freelance', matchType: RuleMatchType.CONTAINS, priority: 10 },
    { category: 'Income', pattern: 'dividend', matchType: RuleMatchType.CONTAINS, priority: 9 },

    // Food & Dining
    { category: 'Food & Dining', pattern: 'starbucks', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Food & Dining', pattern: "mcdonald's", matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Food & Dining', pattern: 'restaurant', matchType: RuleMatchType.CONTAINS, priority: 7 },
    { category: 'Food & Dining', pattern: 'grocery', matchType: RuleMatchType.CONTAINS, priority: 7 },
    { category: 'Food & Dining', pattern: 'uber eats', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Food & Dining', pattern: 'doordash', matchType: RuleMatchType.CONTAINS, priority: 8 },

    // Transportation
    { category: 'Transportation', pattern: 'uber', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Transportation', pattern: 'lyft', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Transportation', pattern: 'parking', matchType: RuleMatchType.CONTAINS, priority: 7 },
    { category: 'Transportation', pattern: 'gas station', matchType: RuleMatchType.CONTAINS, priority: 7 },
    { category: 'Transportation', pattern: 'shell', matchType: RuleMatchType.CONTAINS, priority: 6 },

    // Shopping
    { category: 'Shopping', pattern: 'amazon', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Shopping', pattern: 'walmart', matchType: RuleMatchType.CONTAINS, priority: 7 },
    { category: 'Shopping', pattern: 'target', matchType: RuleMatchType.CONTAINS, priority: 7 },

    // Entertainment
    { category: 'Entertainment', pattern: 'netflix', matchType: RuleMatchType.CONTAINS, priority: 9 },
    { category: 'Entertainment', pattern: 'spotify', matchType: RuleMatchType.CONTAINS, priority: 9 },
    { category: 'Entertainment', pattern: 'steam', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Entertainment', pattern: 'cinema', matchType: RuleMatchType.CONTAINS, priority: 7 },

    // Bills & Utilities
    { category: 'Bills & Utilities', pattern: 'electric', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Bills & Utilities', pattern: 'internet', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Bills & Utilities', pattern: 'water bill', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Bills & Utilities', pattern: 'rent', matchType: RuleMatchType.CONTAINS, priority: 9 },

    // Healthcare
    { category: 'Healthcare', pattern: 'pharmacy', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Healthcare', pattern: 'hospital', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Healthcare', pattern: 'doctor', matchType: RuleMatchType.CONTAINS, priority: 7 },

    // Travel
    { category: 'Travel', pattern: 'airbnb', matchType: RuleMatchType.CONTAINS, priority: 9 },
    { category: 'Travel', pattern: 'hotel', matchType: RuleMatchType.CONTAINS, priority: 8 },
    { category: 'Travel', pattern: 'airline', matchType: RuleMatchType.CONTAINS, priority: 8 },
  ];

  for (const rule of rules) {
    const category = savedCategories[rule.category];
    if (category) {
      const existing = await ruleRepo.findOne({
        where: { categoryId: category.id, pattern: rule.pattern },
      });

      if (!existing) {
        const catRule = ruleRepo.create({
          categoryId: category.id,
          pattern: rule.pattern,
          matchType: rule.matchType,
          priority: rule.priority,
          caseSensitive: false,
        });
        await ruleRepo.save(catRule);
        console.log(`  ✓ Created rule: ${rule.pattern} → ${rule.category}`);
      }
    }
  }

  console.log('✅ Categories and rules seeded successfully');
}
