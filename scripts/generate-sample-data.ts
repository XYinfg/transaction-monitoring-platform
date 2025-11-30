import { AppDataSource } from '../backend/src/database/data-source';
import { User, UserRole } from '../backend/src/modules/users/entities/user.entity';
import { Account } from '../backend/src/modules/accounts/entities/account.entity';
import { Transaction, TransactionSource } from '../backend/src/modules/transactions/entities/transaction.entity';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

async function generateSampleData() {
  console.log('🚀 Starting sample data generation...\n');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const userRepo = AppDataSource.getRepository(User);
    const accountRepo = AppDataSource.getRepository(Account);
    const transactionRepo = AppDataSource.getRepository(Transaction);

    // Create test users
    console.log('👤 Creating users...');

    const password = await argon2.hash('Password123!');

    const regularUser = userRepo.create({
      email: 'user@fintrace.com',
      password,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.USER,
      emailVerified: true,
    });
    await userRepo.save(regularUser);
    console.log('  ✓ Created user: user@fintrace.com (password: Password123!)');

    const analyst = userRepo.create({
      email: 'analyst@fintrace.com',
      password,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.ANALYST,
      emailVerified: true,
    });
    await userRepo.save(analyst);
    console.log('  ✓ Created analyst: analyst@fintrace.com (password: Password123!)');

    const admin = userRepo.create({
      email: 'admin@fintrace.com',
      password,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      emailVerified: true,
    });
    await userRepo.save(admin);
    console.log('  ✓ Created admin: admin@fintrace.com (password: Password123!)\n');

    // Create accounts
    console.log('💳 Creating accounts...');

    const checkingAccount = accountRepo.create({
      userId: regularUser.id,
      name: 'Main Checking Account',
      currency: 'USD',
      balance: 5000,
      accountType: 'checking',
      institutionName: 'DBS Bank',
      accountNumber: '****1234',
    });
    await accountRepo.save(checkingAccount);
    console.log('  ✓ Created checking account');

    const savingsAccount = accountRepo.create({
      userId: regularUser.id,
      name: 'Savings Account',
      currency: 'USD',
      balance: 15000,
      accountType: 'savings',
      institutionName: 'DBS Bank',
      accountNumber: '****5678',
    });
    await accountRepo.save(savingsAccount);
    console.log('  ✓ Created savings account\n');

    // Generate realistic transactions
    console.log('💸 Generating transactions...');

    const transactions: Partial<Transaction>[] = [];
    const now = new Date();

    // Income transactions
    for (let i = 0; i < 3; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      date.setDate(1);

      transactions.push({
        accountId: checkingAccount.id,
        timestamp: date,
        description: 'Monthly Salary Deposit',
        amount: 5000,
        currency: 'USD',
        merchant: 'Employer Inc',
        source: TransactionSource.SYNTHETIC,
        idempotencyKey: uuidv4(),
      });
    }

    // Regular expenses
    const expenses = [
      { desc: 'Rent Payment', amount: -1500, merchant: 'Property Management' },
      { desc: 'Electric Bill', amount: -120, merchant: 'Power Company' },
      { desc: 'Internet Service', amount: -60, merchant: 'ISP Provider' },
      { desc: 'Netflix Subscription', amount: -15.99, merchant: 'Netflix' },
      { desc: 'Spotify Premium', amount: -9.99, merchant: 'Spotify' },
      { desc: 'Grocery Shopping', amount: -150, merchant: 'Whole Foods' },
      { desc: 'Grocery Shopping', amount: -85, merchant: 'Safeway' },
      { desc: 'Gas Station', amount: -45, merchant: 'Shell' },
      { desc: 'Coffee Shop', amount: -5.50, merchant: 'Starbucks' },
      { desc: 'Lunch', amount: -12.99, merchant: "McDonald's" },
      { desc: 'Dinner', amount: -45, merchant: 'Italian Restaurant' },
      { desc: 'Uber Ride', amount: -18, merchant: 'Uber' },
      { desc: 'Amazon Purchase', amount: -89, merchant: 'Amazon' },
      { desc: 'Gym Membership', amount: -50, merchant: 'Fitness Club' },
    ];

    for (let month = 0; month < 3; month++) {
      for (const expense of expenses) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - month);
        date.setDate(Math.floor(Math.random() * 28) + 1);
        date.setHours(Math.floor(Math.random() * 24));

        transactions.push({
          accountId: checkingAccount.id,
          timestamp: date,
          description: expense.desc,
          amount: expense.amount,
          currency: 'USD',
          merchant: expense.merchant,
          source: TransactionSource.SYNTHETIC,
          idempotencyKey: uuidv4(),
        });
      }
    }

    // Add some unusual transactions for AML testing
    const unusualDate = new Date(now);
    unusualDate.setDate(unusualDate.getDate() - 2);

    // Large transaction
    transactions.push({
      accountId: checkingAccount.id,
      timestamp: unusualDate,
      description: 'Large Purchase',
      amount: -3500,
      currency: 'USD',
      merchant: 'Electronics Store',
      source: TransactionSource.SYNTHETIC,
      idempotencyKey: uuidv4(),
    });

    // Multiple small transactions (velocity test)
    for (let i = 0; i < 12; i++) {
      const velocityDate = new Date(unusualDate);
      velocityDate.setMinutes(velocityDate.getMinutes() + i * 5);

      transactions.push({
        accountId: checkingAccount.id,
        timestamp: velocityDate,
        description: `Online Purchase ${i + 1}`,
        amount: -25,
        currency: 'USD',
        merchant: 'Online Retailer',
        source: TransactionSource.SYNTHETIC,
        idempotencyKey: uuidv4(),
      });
    }

    // Structuring-like pattern (multiple transactions just below threshold)
    for (let i = 0; i < 4; i++) {
      const structuringDate = new Date(unusualDate);
      structuringDate.setHours(structuringDate.getHours() + i * 2);

      transactions.push({
        accountId: checkingAccount.id,
        timestamp: structuringDate,
        description: `Cash Withdrawal ${i + 1}`,
        amount: -9800,
        currency: 'USD',
        merchant: 'ATM Withdrawal',
        source: TransactionSource.SYNTHETIC,
        idempotencyKey: uuidv4(),
      });
    }

    // Savings account transactions
    transactions.push({
      accountId: savingsAccount.id,
      timestamp: new Date(now.setMonth(now.getMonth() - 1)),
      description: 'Interest Payment',
      amount: 25,
      currency: 'USD',
      merchant: 'DBS Bank',
      source: TransactionSource.SYNTHETIC,
      idempotencyKey: uuidv4(),
    });

    // Save all transactions
    for (const txn of transactions) {
      const transaction = transactionRepo.create(txn);
      await transactionRepo.save(transaction);
    }
    console.log(`  ✓ Generated ${transactions.length} transactions\n`);

    console.log('✅ Sample data generation completed!\n');
    console.log('📝 Test Credentials:');
    console.log('   Regular User: user@fintrace.com / Password123!');
    console.log('   Analyst: analyst@fintrace.com / Password123!');
    console.log('   Admin: admin@fintrace.com / Password123!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating sample data:', error);
    process.exit(1);
  }
}

generateSampleData();
