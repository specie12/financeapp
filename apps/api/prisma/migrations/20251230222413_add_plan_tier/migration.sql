/*
  Warnings:

  - Added the required column `start_date` to the `liabilities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'pro', 'premium');

-- AlterTable
ALTER TABLE "households" ADD COLUMN     "plan_tier" "PlanTier" NOT NULL DEFAULT 'free';

-- AlterTable
ALTER TABLE "liabilities" ADD COLUMN     "start_date" DATE NOT NULL,
ADD COLUMN     "term_months" INTEGER;
