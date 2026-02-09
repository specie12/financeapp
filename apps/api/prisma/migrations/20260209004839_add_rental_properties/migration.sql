-- CreateTable
CREATE TABLE "rental_properties" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "purchase_price_cents" INTEGER NOT NULL,
    "current_value_cents" INTEGER NOT NULL,
    "down_payment_cents" INTEGER NOT NULL,
    "monthly_rent_cents" INTEGER NOT NULL,
    "vacancy_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "annual_expenses_cents" INTEGER NOT NULL,
    "property_tax_annual_cents" INTEGER NOT NULL,
    "mortgage_payment_cents" INTEGER,
    "mortgage_rate_percent" DECIMAL(5,3),
    "linked_asset_id" UUID,
    "linked_liability_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_properties_household_id_idx" ON "rental_properties"("household_id");

-- AddForeignKey
ALTER TABLE "rental_properties" ADD CONSTRAINT "rental_properties_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;
