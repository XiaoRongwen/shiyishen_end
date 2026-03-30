-- CreateTable
CREATE TABLE `files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filename` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `uploaded_by` INTEGER NOT NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `files_uploaded_by_idx`(`uploaded_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supervision_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partnership_id` INTEGER NOT NULL,
    `supervision_type` VARCHAR(20) NOT NULL,
    `supervision_date` DATETIME(3) NOT NULL,
    `premises` TEXT NULL,
    `equipment` TEXT NULL,
    `personnel` TEXT NULL,
    `materials` TEXT NULL,
    `production` TEXT NULL,
    `inspection` TEXT NULL,
    `transportation` TEXT NULL,
    `labeling` TEXT NULL,
    `principal_confirmed` BOOLEAN NOT NULL DEFAULT false,
    `trustee_confirmed` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `reject_reason` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `supervision_records_partnership_id_idx`(`partnership_id`),
    INDEX `supervision_records_status_idx`(`status`),
    INDEX `supervision_records_supervision_date_idx`(`supervision_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supervision_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supervision_record_id` INTEGER NOT NULL,
    `file_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `supervision_files_supervision_record_id_idx`(`supervision_record_id`),
    INDEX `supervision_files_file_id_idx`(`file_id`),
    UNIQUE INDEX `supervision_files_supervision_record_id_file_id_key`(`supervision_record_id`, `file_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualification_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partnership_id` INTEGER NOT NULL,
    `file_id` INTEGER NOT NULL,
    `qualification_type` VARCHAR(100) NOT NULL,
    `expiry_date` DATETIME(3) NULL,
    `verification_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `verification_note` TEXT NULL,
    `verified_by` INTEGER NULL,
    `verified_at` DATETIME(3) NULL,
    `retention_until` DATETIME(3) NOT NULL,
    `archived` BOOLEAN NOT NULL DEFAULT false,
    `uploaded_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `qualification_records_partnership_id_idx`(`partnership_id`),
    INDEX `qualification_records_verification_status_idx`(`verification_status`),
    INDEX `qualification_records_retention_until_idx`(`retention_until`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regulatory_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partnership_id` INTEGER NOT NULL,
    `food_category` VARCHAR(200) NOT NULL,
    `standard` VARCHAR(200) NOT NULL,
    `contract_period` VARCHAR(200) NOT NULL,
    `change_reason` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `deadline` DATETIME(3) NOT NULL,
    `submitted_at` DATETIME(3) NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `regulatory_reports_partnership_id_idx`(`partnership_id`),
    INDEX `regulatory_reports_status_idx`(`status`),
    INDEX `regulatory_reports_deadline_idx`(`deadline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `supervision_records` ADD CONSTRAINT `supervision_records_partnership_id_fkey` FOREIGN KEY (`partnership_id`) REFERENCES `partnerships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervision_files` ADD CONSTRAINT `supervision_files_supervision_record_id_fkey` FOREIGN KEY (`supervision_record_id`) REFERENCES `supervision_records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervision_files` ADD CONSTRAINT `supervision_files_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualification_records` ADD CONSTRAINT `qualification_records_partnership_id_fkey` FOREIGN KEY (`partnership_id`) REFERENCES `partnerships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualification_records` ADD CONSTRAINT `qualification_records_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regulatory_reports` ADD CONSTRAINT `regulatory_reports_partnership_id_fkey` FOREIGN KEY (`partnership_id`) REFERENCES `partnerships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
