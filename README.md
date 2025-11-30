# FinTrace - Transaction Monitoring & Insights Platform

> A production-grade fintech application demonstrating transaction monitoring, AML-style fraud detection, and financial analytics.

## Overview

FinTrace is an open-banking inspired platform that ingests financial transaction data, normalizes it into ledger entries, categorizes spending, and runs AML/fraud-style detection rules with comprehensive dashboards and auditable APIs.

### Key Features

- **Secure Authentication** - JWT-based auth with refresh tokens and role-based access control
- **Account Management** - Multi-account support with balance tracking
- **Transaction Processing** - CSV import, normalization, and ledger-based accounting
- **Smart Categorization** - Rule-based and ML-ready transaction categorization
- **Analytics Dashboard** - Real-time insights, spending patterns, and trend analysis
- **AML/Fraud Detection** - Configurable rules engine for suspicious activity monitoring
- **Alert Management** - Analyst workflow for reviewing and clearing alerts
- **Audit Logging** - Comprehensive audit trail for compliance and security
- **API Documentation** - Auto-generated OpenAPI/Swagger documentation

## Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Cache/Queue**: Redis + BullMQ
- **Authentication**: JWT with refresh tokens
- **Validation**: class-validator, class-transformer
- **Testing**: Jest (unit + integration)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State**: React Query + Context API
- **Routing**: React Router v6

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier
- **API Docs**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd transaction_monitoring
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api

### Local Development (without Docker)

#### Backend

```bash
cd backend
npm install
npm run migration:run
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
transaction_monitoring/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication & authorization
│   │   │   ├── users/      # User management
│   │   │   ├── accounts/   # Account management
│   │   │   ├── transactions/ # Transaction processing
│   │   │   ├── categories/ # Categorization engine
│   │   │   ├── analytics/  # Analytics & reporting
│   │   │   ├── rules/      # AML/fraud rules engine
│   │   │   ├── alerts/     # Alert management
│   │   │   └── audit/      # Audit logging
│   │   ├── common/         # Shared utilities
│   │   └── database/       # Database configuration
│   ├── migrations/         # Database migrations
│   └── test/              # Tests
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utilities
├── docs/                  # Documentation
├── scripts/               # Utility scripts
└── .github/              # CI/CD workflows
```

## Core Capabilities

### Phase 1: Foundations
- ✅ User management with role-based access (user, analyst, admin)
- ✅ JWT authentication with refresh token rotation
- ✅ Multi-account support with balance tracking
- ✅ CSV transaction import with validation
- ✅ RESTful API with proper error handling

### Phase 2: Intelligence
- ✅ Rule-based transaction categorization
- ✅ Analytics endpoints (spending by category, cashflow, trends)
- ✅ Interactive dashboard with visualizations
- ✅ Multi-account aggregation

### Phase 3: Risk & Compliance
- ✅ Configurable rules engine for AML/fraud detection
- ✅ Alert generation and management workflow
- ✅ Comprehensive audit logging
- ✅ Analyst UI for alert review

### Phase 4: Production Polish
- ✅ API rate limiting
- ✅ OpenAPI/Swagger documentation
- ✅ Health check endpoints
- ✅ Structured logging with request IDs
- ✅ Comprehensive test coverage
- ✅ CI/CD pipeline

## API Documentation

Once the backend is running, visit http://localhost:3000/api for interactive API documentation.

### Key Endpoints

**Authentication**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token

**Accounts**
- `GET /api/v1/accounts` - List user accounts
- `POST /api/v1/accounts` - Create account
- `GET /api/v1/accounts/:id` - Get account details

**Transactions**
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions/import` - Import CSV
- `GET /api/v1/accounts/:id/transactions` - Account transactions

**Analytics**
- `GET /api/v1/analytics/summary` - Spending summary
- `GET /api/v1/analytics/by-category` - Category breakdown
- `GET /api/v1/analytics/cashflow` - Cashflow analysis

**Alerts** (Analyst/Admin only)
- `GET /api/v1/alerts` - List alerts
- `PATCH /api/v1/alerts/:id` - Update alert status
- `GET /api/v1/alerts/:id` - Alert details

## Testing

### Backend Tests
```bash
cd backend
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm run test           # Component tests
```

## Database Schema

Key tables:
- `users` - User accounts with role-based permissions
- `accounts` - Financial accounts linked to users
- `transactions` - Transaction records with categorization
- `categorization_rules` - Rules for automatic categorization
- `rules` - AML/fraud detection rule definitions
- `alerts` - Generated alerts from rule violations
- `audit_logs` - Comprehensive audit trail

See `/docs/database-schema.md` for detailed schema documentation.

## Security Features

- Password hashing with argon2
- JWT with short-lived access tokens + refresh token rotation
- Role-based access control (RBAC)
- Request rate limiting
- Input validation and sanitization
- SQL injection prevention via ORM
- CORS configuration
- Audit logging for security events

## Compliance & Fintech Patterns

This project demonstrates key fintech concepts:

1. **Double-entry accounting** - Proper ledger-based transaction handling
2. **Idempotency** - Safe retry mechanisms for financial operations
3. **Audit trails** - Complete logging of all sensitive operations
4. **AML patterns** - Transaction monitoring and suspicious activity detection
5. **Data precision** - Proper handling of decimal arithmetic for money
6. **Security-first** - Authentication, authorization, and data protection

## Contributing

This is a portfolio project, but suggestions and improvements are welcome!

## License

MIT License - see LICENSE file for details

## Author

Built as a portfolio project to demonstrate fintech engineering capabilities.

## Acknowledgments

Project inspired by real-world fintech patterns from neobanks, payment processors, and regulatory compliance requirements.
