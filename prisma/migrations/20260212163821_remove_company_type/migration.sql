/*
  Warnings:

  - You are about to drop the column `type` on the `companies` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `companies_type_idx` ON `companies`;

-- AlterTable
ALTER TABLE `companies` DROP COLUMN `type`;
