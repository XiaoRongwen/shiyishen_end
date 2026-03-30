/*
  Warnings:

  - You are about to drop the `companies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `partnerships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qualification_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regulatory_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supervision_files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supervision_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_companies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `partnerships` DROP FOREIGN KEY `partnerships_principal_id_fkey`;

-- DropForeignKey
ALTER TABLE `partnerships` DROP FOREIGN KEY `partnerships_trustee_id_fkey`;

-- DropForeignKey
ALTER TABLE `qualification_records` DROP FOREIGN KEY `qualification_records_file_id_fkey`;

-- DropForeignKey
ALTER TABLE `qualification_records` DROP FOREIGN KEY `qualification_records_partnership_id_fkey`;

-- DropForeignKey
ALTER TABLE `regulatory_reports` DROP FOREIGN KEY `regulatory_reports_partnership_id_fkey`;

-- DropForeignKey
ALTER TABLE `supervision_files` DROP FOREIGN KEY `supervision_files_file_id_fkey`;

-- DropForeignKey
ALTER TABLE `supervision_files` DROP FOREIGN KEY `supervision_files_supervision_record_id_fkey`;

-- DropForeignKey
ALTER TABLE `supervision_records` DROP FOREIGN KEY `supervision_records_partnership_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_companies` DROP FOREIGN KEY `user_companies_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_companies` DROP FOREIGN KEY `user_companies_user_id_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'user';

-- DropTable
DROP TABLE `companies`;

-- DropTable
DROP TABLE `files`;

-- DropTable
DROP TABLE `partnerships`;

-- DropTable
DROP TABLE `qualification_records`;

-- DropTable
DROP TABLE `regulatory_reports`;

-- DropTable
DROP TABLE `supervision_files`;

-- DropTable
DROP TABLE `supervision_records`;

-- DropTable
DROP TABLE `user_companies`;

-- CreateIndex
CREATE INDEX `users_role_idx` ON `users`(`role`);
