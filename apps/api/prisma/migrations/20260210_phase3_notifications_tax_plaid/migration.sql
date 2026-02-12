-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('budget_exceeded', 'goal_milestone', 'bill_due', 'large_transaction', 'net_worth_milestone', 'ai_insight');

-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household');

-- CreateEnum
CREATE TYPE "PlaidItemStatus" AS ENUM ('active', 'error', 'disconnected');

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "plaid_account_id" TEXT,
ADD COLUMN     "plaid_item_id" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "plaid_transaction_id" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_profiles" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "filing_status" "FilingStatus" NOT NULL,
    "state_code" VARCHAR(2),
    "dependents" INTEGER NOT NULL DEFAULT 0,
    "additional_income_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plaid_items" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "item_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "status" "PlaidItemStatus" NOT NULL DEFAULT 'active',
    "cursor" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plaid_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tax_profiles_household_id_tax_year_key" ON "tax_profiles"("household_id", "tax_year");

-- CreateIndex
CREATE UNIQUE INDEX "plaid_items_item_id_key" ON "plaid_items"("item_id");

-- CreateIndex
CREATE INDEX "plaid_items_household_id_idx" ON "plaid_items"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_plaid_account_id_key" ON "accounts"("plaid_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_plaid_transaction_id_key" ON "transactions"("plaid_transaction_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plaid_items" ADD CONSTRAINT "plaid_items_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;
