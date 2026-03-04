/*
  Warnings:

  - Changed the type of `country` on the `Airport` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Airport" DROP COLUMN "country",
ADD COLUMN     "country" VARCHAR(100) NOT NULL;

-- DropEnum
DROP TYPE "Country";
