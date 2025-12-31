-- CreateEnum
CREATE TYPE "Country" AS ENUM ('US', 'UK', 'CA');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('net_worth_target', 'savings_target', 'debt_freedom');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('active', 'achieved', 'paused');

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "dividend_yield_percent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "country" "Country" NOT NULL DEFAULT 'US';

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "type" "GoalType" NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount_cents" INTEGER NOT NULL,
    "current_amount_cents" INTEGER NOT NULL DEFAULT 0,
    "target_date" DATE,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "linked_liability_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goals_household_id_idx" ON "goals"("household_id");

-- CreateIndex
CREATE INDEX "goals_type_idx" ON "goals"("type");

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "goals"("status");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_linked_liability_id_fkey" FOREIGN KEY ("linked_liability_id") REFERENCES "liabilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
