# FinTrace Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ Docker Desktop running
- ✅ Terminal/Command Line access

## 5-Minute Setup

### Step 1: Start Infrastructure (1 min)

```bash
# Navigate to project directory
cd /Users/xuyinfeng/bait/transaction_monitoring

# Start PostgreSQL and Redis
docker compose up -d

# Verify services are running
docker compose ps
# You should see postgres and redis in "running" state
```

### Step 2: Setup Backend (2 min)

```bash
# Open a new terminal tab
cd backend

# Install dependencies (if not already done)
npm install

# Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fintrace

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
EOF

# Run database migrations
npm run migration:run

# Start backend server
npm run start:dev
```

**Backend Ready**: http://localhost:3000
**API Docs**: http://localhost:3000/api

### Step 3: Setup Frontend (1 min)

```bash
# Open another terminal tab
cd frontend

# Install dependencies (if not already done)
npm install

# Create .env.local file
echo "VITE_API_URL=http://localhost:3000" > .env.local

# Start frontend dev server
npm run dev
```

**Frontend Ready**: http://localhost:5173

### Step 4: Create Your First User (1 min)

Visit http://localhost:5173 and click **Register**

Fill in the form:
- **Email**: test@example.com
- **Password**: Password123! (min 8 chars, 1 uppercase, 1 number)
- **First Name**: Test
- **Last Name**: User

Click **Register** and you'll be logged in automatically!

## Quick Test Flow

### 1. Create an Account
- Click **Accounts** in sidebar
- Click **Add Account**
- Fill in:
  - Name: "My Checking"
  - Institution: "Test Bank"
  - Currency: USD
  - Initial Balance: 1000
- Click **Create Account**

### 2. Import Transactions

Create a test CSV file (`test-transactions.csv`):
```csv
date,description,amount,merchant
2024-01-01,Grocery shopping,-125.50,Walmart
2024-01-02,Gas station,-45.00,Shell
2024-01-03,Restaurant dinner,-67.30,Olive Garden
2024-01-04,Coffee,-5.25,Starbucks
2024-01-05,Salary,3500.00,Employer Inc
2024-01-06,Large purchase,-9500.00,Luxury Store
```

- Click **Transactions** in sidebar
- Select your account from dropdown
- Click **Import CSV**
- Choose your test file
- Click **Import**

### 3. View Analytics
- Click **Dashboard** to see summary statistics
- Click **Analytics** to see detailed charts:
  - Cashflow trends
  - Spending by category
  - Top merchants

### 4. Test AML Detection (Admin Required)

First, promote your user to admin in the database:
```bash
# In a new terminal
docker exec -it transaction_monitoring-postgres-1 psql -U postgres -d fintrace

# In psql:
UPDATE users SET role = 'admin' WHERE email = 'test@example.com';
\q
```

Then in the app:
- Refresh the page and click **Rules** in sidebar
- Click **Create Rule**
- Configure a "Large Transaction" rule:
  - Name: "Large Transaction Alert"
  - Type: Large Transaction
  - Severity: High
  - Multiplier: 3
  - Lookback Days: 30
- Click **Create Rule**

Now check the **Alerts** page - you should see an alert for the $9,500 transaction!

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000
# Kill it
kill -9 <PID>

# Or use different port in backend .env:
PORT=3001
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker compose ps

# View logs
docker compose logs postgres

# Restart services
docker compose restart postgres
```

### Frontend Can't Connect to Backend
1. Check backend is running on port 3000
2. Verify VITE_API_URL in frontend/.env.local
3. Check browser console for CORS errors
4. Ensure CORS_ORIGIN in backend .env matches frontend URL

### "Migration Already Run" Error
```bash
# View migration status
cd backend
npm run migration:show

# Revert last migration if needed
npm run migration:revert

# Re-run migrations
npm run migration:run
```

## Testing

### Run Backend Unit Tests
```bash
cd backend
npm test                 # All tests
npm test -- money.util   # Specific test
npm run test:cov        # With coverage
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Manual API Testing

Using curl:
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@test.com",
    "password": "Password123!",
    "firstName": "API",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@test.com",
    "password": "Password123!"
  }'
# Copy the accessToken from response

# List accounts
curl -X GET http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Stopping the Application

```bash
# Stop frontend (Ctrl+C in terminal)
# Stop backend (Ctrl+C in terminal)

# Stop Docker services
docker compose down

# Stop and remove volumes (clears database)
docker compose down -v
```

## Next Steps

- ✅ Explore all features in the UI
- ✅ Test the AML detection rules
- ✅ Review the API documentation at http://localhost:3000/api
- ✅ Run the test suites
- ✅ Check the comprehensive guides:
  - [TESTING.md](./TESTING.md) - Full testing guide
  - [README.md](./README.md) - Complete documentation
  - [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Project overview

## Support

For issues:
1. Check [TESTING.md](./TESTING.md) troubleshooting section
2. Review [TEST_RESULTS.md](./TEST_RESULTS.md) for known issues
3. Check Docker and service logs
4. Verify all environment variables are set

---

**Time to Full Setup**: ~5 minutes
**Prerequisites**: Docker Desktop running
**Difficulty**: Easy

Enjoy exploring FinTrace! 🚀
