ALTER TABLE "Airport" ADD COLUMN IF NOT EXISTS "cityImageUrl" VARCHAR(500);

CREATE TABLE IF NOT EXISTS "Promo" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "flightId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Promo_flightId_fkey'
    ) THEN
        ALTER TABLE "Promo"
        ADD CONSTRAINT "Promo_flightId_fkey"
        FOREIGN KEY ("flightId")
        REFERENCES "Flight"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;
