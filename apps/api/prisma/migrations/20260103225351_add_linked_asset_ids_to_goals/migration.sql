-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "linked_asset_ids" UUID[] DEFAULT ARRAY[]::UUID[];
