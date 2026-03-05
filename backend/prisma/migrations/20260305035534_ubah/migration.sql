/*
  Warnings:

  - You are about to alter the column `documentNumber` on the `Passenger` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(16)`.
  - The `documentType` column on the `Passenger` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Passenger" ALTER COLUMN "documentNumber" SET DATA TYPE VARCHAR(16),
DROP COLUMN "documentType",
ADD COLUMN     "documentType" "documentType" NOT NULL DEFAULT 'KTP';
