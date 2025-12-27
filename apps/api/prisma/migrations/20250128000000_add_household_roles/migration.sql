-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('owner', 'editor', 'viewer');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "HouseholdRole" NOT NULL DEFAULT 'owner';
