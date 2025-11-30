import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('user', 'analyst', 'admin');

      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "first_name" VARCHAR NOT NULL,
        "last_name" VARCHAR NOT NULL,
        "role" user_role_enum NOT NULL DEFAULT 'user',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "email_verified" BOOLEAN NOT NULL DEFAULT false,
        "refresh_token" VARCHAR,
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );

      CREATE INDEX "idx_users_email" ON "users"("email");
      CREATE INDEX "idx_users_role" ON "users"("role");
    `);

    // Accounts table
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "name" VARCHAR NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
        "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "account_type" VARCHAR,
        "institution_name" VARCHAR,
        "account_number" VARCHAR,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_accounts_user_id" ON "accounts"("user_id");
    `);

    // Categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR NOT NULL UNIQUE,
        "description" TEXT,
        "icon" VARCHAR,
        "color" VARCHAR,
        "parent_id" uuid,
        "is_system" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );

      CREATE INDEX "idx_categories_name" ON "categories"("name");
    `);

    // Transactions table
    await queryRunner.query(`
      CREATE TYPE "transaction_source_enum" AS ENUM ('csv_upload', 'manual', 'api', 'synthetic');

      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "account_id" uuid NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "description" TEXT NOT NULL,
        "amount" DECIMAL(15,2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL,
        "balance_after" DECIMAL(15,2),
        "merchant" VARCHAR,
        "merchant_category" VARCHAR,
        "category_id" uuid,
        "source" transaction_source_enum NOT NULL DEFAULT 'csv_upload',
        "reference_number" VARCHAR UNIQUE,
        "idempotency_key" VARCHAR UNIQUE,
        "metadata" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_transactions_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_transactions_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      );

      CREATE INDEX "idx_transactions_account_timestamp" ON "transactions"("account_id", "timestamp");
      CREATE INDEX "idx_transactions_account_category" ON "transactions"("account_id", "category_id");
      CREATE INDEX "idx_transactions_timestamp" ON "transactions"("timestamp");
      CREATE INDEX "idx_transactions_amount" ON "transactions"("amount");
    `);

    // Categorization Rules table
    await queryRunner.query(`
      CREATE TYPE "rule_match_type_enum" AS ENUM ('contains', 'starts_with', 'ends_with', 'exact', 'regex');

      CREATE TABLE "categorization_rules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "category_id" uuid NOT NULL,
        "pattern" VARCHAR NOT NULL,
        "match_type" rule_match_type_enum NOT NULL DEFAULT 'contains',
        "case_sensitive" BOOLEAN NOT NULL DEFAULT false,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_categorization_rules_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_categorization_rules_category" ON "categorization_rules"("category_id");
      CREATE INDEX "idx_categorization_rules_priority" ON "categorization_rules"("priority" DESC);
    `);

    // Rules table (AML/Fraud rules)
    await queryRunner.query(`
      CREATE TYPE "rule_severity_enum" AS ENUM ('low', 'medium', 'high', 'critical');
      CREATE TYPE "rule_type_enum" AS ENUM ('large_transaction', 'velocity', 'structuring', 'unusual_pattern', 'foreign_transaction', 'custom');

      CREATE TABLE "rules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR NOT NULL UNIQUE,
        "description" TEXT NOT NULL,
        "type" rule_type_enum NOT NULL DEFAULT 'custom',
        "severity" rule_severity_enum NOT NULL DEFAULT 'medium',
        "condition" JSONB NOT NULL,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "auto_resolve" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );

      CREATE INDEX "idx_rules_enabled" ON "rules"("enabled");
      CREATE INDEX "idx_rules_type" ON "rules"("type");
    `);

    // Alerts table
    await queryRunner.query(`
      CREATE TYPE "alert_status_enum" AS ENUM ('open', 'reviewing', 'resolved', 'false_positive', 'escalated');

      CREATE TABLE "alerts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "transaction_id" uuid,
        "rule_id" uuid NOT NULL,
        "status" alert_status_enum NOT NULL DEFAULT 'open',
        "notes" TEXT,
        "context" JSONB,
        "assigned_to" uuid,
        "resolved_at" TIMESTAMP,
        "resolved_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_alerts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_alerts_transaction" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_alerts_rule" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_alerts_user_status" ON "alerts"("user_id", "status");
      CREATE INDEX "idx_alerts_rule_created" ON "alerts"("rule_id", "created_at");
      CREATE INDEX "idx_alerts_status" ON "alerts"("status");
    `);

    // Audit Logs table
    await queryRunner.query(`
      CREATE TYPE "audit_action_enum" AS ENUM (
        'login_success', 'login_failed', 'logout', 'register', 'password_changed',
        'account_created', 'account_updated', 'account_deleted',
        'transaction_created', 'transaction_imported', 'transaction_updated',
        'rule_created', 'rule_updated', 'rule_deleted', 'rule_enabled', 'rule_disabled',
        'alert_created', 'alert_reviewed', 'alert_resolved', 'alert_escalated',
        'user_role_changed', 'user_deactivated'
      );

      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "action" audit_action_enum NOT NULL,
        "resource_type" VARCHAR,
        "resource_id" VARCHAR,
        "metadata" JSONB,
        "ip_address" VARCHAR,
        "user_agent" VARCHAR,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      );

      CREATE INDEX "idx_audit_logs_user_created" ON "audit_logs"("user_id", "created_at");
      CREATE INDEX "idx_audit_logs_action_created" ON "audit_logs"("action", "created_at");
      CREATE INDEX "idx_audit_logs_created" ON "audit_logs"("created_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "audit_action_enum"`);

    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP TYPE "alert_status_enum"`);

    await queryRunner.query(`DROP TABLE "rules"`);
    await queryRunner.query(`DROP TYPE "rule_severity_enum"`);
    await queryRunner.query(`DROP TYPE "rule_type_enum"`);

    await queryRunner.query(`DROP TABLE "categorization_rules"`);
    await queryRunner.query(`DROP TYPE "rule_match_type_enum"`);

    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "transaction_source_enum"`);

    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
