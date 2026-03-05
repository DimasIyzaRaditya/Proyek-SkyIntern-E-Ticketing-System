/*
  Warnings:

  - You are about to drop the column `idNumber` on the `Passenger` table. All the data in the column will be lost.
  - You are about to drop the column `idType` on the `Passenger` table. All the data in the column will be lost.
  - Added the required column `documentNumber` to the `Passenger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentType` to the `Passenger` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "documentType" AS ENUM ('KTP', 'PASSPORT');

-- AlterTable
ALTER TABLE "Passenger" DROP COLUMN "idNumber",
DROP COLUMN "idType",
ADD COLUMN     "documentImageUrl" VARCHAR(500),
ADD COLUMN     "documentNumber" VARCHAR(50) NOT NULL,
ADD COLUMN     "documentType" VARCHAR(30) NOT NULL;
