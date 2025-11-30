# FinTrace - Quick Start Guide

Welcome to FinTrace! This guide will help you get the application running quickly.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Quick Start (Docker - Recommended)

1. **Start the application**
   ```bash
   docker-compose up -d
   ```

2. **Wait for services to be ready** (about 30-60 seconds)
   ```bash
   docker-compose logs -f backend
   ```
   Wait until you see "Server running at: http://localhost:3000"

3. **Run database migrations**
   ```bash
   docker-compose exec backend npm run migration:run
   ```

4. **Seed initial data (categories and rules)**
   ```bash
   docker-compose exec backend npm run seed
   ```

5. **Generate sample data for testing**
   ```bash
   docker-compose exec backend npx ts-node /app/scripts/generate-sample-data.ts
   ```

6. **Access the application**
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api
   - Frontend: http://localhost:5173 (when built)

## Test Credentials

After running the sample data generator:

| Role | Email | Password |
|------|-------|----------|
| Regular User | user@fintrace.com | Password123! |
| Analyst | analyst@fintrace.com | Password123! |
| Admin | admin@fintrace.com | Password123! |

## Local Development (Without Docker)

### Backend

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp ../.env.example ../.env
   # Edit .env with your database credentials
   ```

3. **Start PostgreSQL and Redis** (using Docker or locally)
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=fintrace_dev_password -e POSTGRES_USER=fintrace_user -e POSTGRES_DB=fintrace postgres:15-alpine
   docker run -d -p 6379:6379 redis:7-alpine
   ```

4. **Run migrations**
   ```bash
   npm run migration:run
   ```

5. **Seed initial data**
   ```bash
   npm run seed
   ```

6. **Generate sample data**
   ```bash
   npx ts-node ../scripts/generate-sample-data.ts
   ```

7. **Start the development server**
   ```bash
   npm run start:dev
   ```

## Testing the API

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@fintrace.com",
    "password": "Password123!"
  }'
```

Save the `accessToken` from the response.

### 3. Get Accounts

```bash
curl -X GET http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Get Transactions

```bash
curl -X GET "http://localhost:3000/api/v1/transactions/account/ACCOUNT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Get Analytics

```bash
curl -X GET http://localhost:3000/api/v1/analytics/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. View Alerts (Analyst/Admin)

```bash
curl -X GET http://localhost:3000/api/v1/alerts \
  -H "Authorization: Bearer ANALYST_ACCESS_TOKEN"
```

## CSV Import Example

Create a sample CSV file (transactions.csv):

```csv
date,description,amount,merchant
2024-01-15,Coffee Shop,-5.50,Starbucks
2024-01-16,Salary Deposit,5000.00,Employer Inc
2024-01-17,Grocery Shopping,-125.50,Whole Foods
2024-01-18,Gas Station,-45.00,Shell
2024-01-19,Netflix Subscription,-15.99,Netflix
```

Import via API:

```bash
curl -X POST http://localhost:3000/api/v1/transactions/import/csv \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@transactions.csv" \
  -F "accountId=YOUR_ACCOUNT_ID"
```

## Exploring the Application

### 1. API Documentation
Visit http://localhost:3000/api to explore all available endpoints with Swagger UI.

### 2. Check Analytics
- **Spending Summary**: `/api/v1/analytics/summary`
- **Category Breakdown**: `/api/v1/analytics/by-category`
- **Cashflow Data**: `/api/v1/analytics/cashflow`
- **Spending Trends**: `/api/v1/analytics/trends`
- **Top Merchants**: `/api/v1/analytics/top-merchants`

### 3. Review AML/Fraud Rules
- **List Rules**: GET `/api/v1/rules`
- **View Rule Details**: GET `/api/v1/rules/:id`

### 4. Manage Alerts (Analyst Role)
- **List Alerts**: GET `/api/v1/alerts`
- **Get Alert Details**: GET `/api/v1/alerts/:id`
- **Assign to Self**: POST `/api/v1/alerts/:id/assign`
- **Resolve Alert**: POST `/api/v1/alerts/:id/resolve`
- **Mark False Positive**: POST `/api/v1/alerts/:id/false-positive`

### 5. Audit Trail
- **View Audit Logs**: GET `/api/v1/audit` (Admin/Analyst only)
- **User Activity**: GET `/api/v1/audit/user/:userId`

## Common Commands

```bash
# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Access database
docker-compose exec postgres psql -U fintrace_user -d fintrace

# Access backend shell
docker-compose exec backend sh

# Run tests
docker-compose exec backend npm test

# Check linting
docker-compose exec backend npm run lint
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Error
```bash
# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres

# Verify database is healthy
docker-compose exec postgres pg_isready -U fintrace_user
```

### Migration Errors
```bash
# Reset database (WARNING: Destroys all data)
docker-compose exec backend npm run migration:revert
docker-compose exec backend npm run migration:run
```

## Next Steps

1. **Explore the API** - Use Swagger UI at http://localhost:3000/api
2. **Test CSV Import** - Import your own transaction data
3. **Review Alerts** - Check generated AML/fraud alerts
4. **Build Frontend** - Start developing the React frontend
5. **Customize Rules** - Add your own fraud detection rules
6. **Add Tests** - Write comprehensive test coverage

## Production Deployment

Before deploying to production:

1. Change all default passwords and secrets
2. Set strong JWT secrets in environment variables
3. Enable SSL/TLS
4. Set up proper database backups
5. Configure monitoring and logging
6. Review and harden security settings
7. Set up rate limiting and DDoS protection
8. Run security audit: `npm audit`

## Support

- GitHub Issues: [Report a bug or request a feature]
- Documentation: See `/docs` folder
- API Docs: http://localhost:3000/api

## License

MIT License - See LICENSE file for details
