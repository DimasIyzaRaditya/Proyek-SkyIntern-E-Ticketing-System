ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "transactionReminderSentAt" TIMESTAMP(3);
