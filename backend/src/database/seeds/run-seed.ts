import { AppDataSource } from '../data-source';
import { seedCategories } from './category.seed';
import { seedRules } from './rules.seed';

async function runSeeds() {
  console.log('🌱 Starting database seeding...');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Run seeds in order
    await seedCategories(AppDataSource);
    await seedRules(AppDataSource);

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeeds();
