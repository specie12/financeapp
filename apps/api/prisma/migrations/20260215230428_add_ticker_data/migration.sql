-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "cost_basis_cents" INTEGER,
ADD COLUMN     "day_change" DECIMAL(8,4),
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "last_price_cents" INTEGER,
ADD COLUMN     "last_price_date" TIMESTAMP(3),
ADD COLUMN     "month_change" DECIMAL(8,4),
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "shares" DECIMAL(15,6),
ADD COLUMN     "ticker" TEXT,
ADD COLUMN     "week_change" DECIMAL(8,4),
ADD COLUMN     "ytd_change" DECIMAL(8,4);

-- CreateIndex
CREATE INDEX "assets_ticker_idx" ON "assets"("ticker");

-- CreateIndex
CREATE INDEX "assets_sector_idx" ON "assets"("sector");
