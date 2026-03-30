-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `openid` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar` VARCHAR(500) NULL,
    `nickname` VARCHAR(100) NULL,
    `last_login` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_openid_key`(`openid`),
    INDEX `users_openid_idx`(`openid`),
    INDEX `users_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(20) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `address` VARCHAR(500) NOT NULL,
    `legal_person` VARCHAR(100) NOT NULL,
    `contact` VARCHAR(20) NOT NULL,
    `license_no` VARCHAR(100) NOT NULL,
    `license_type` VARCHAR(50) NOT NULL,
    `business_license` VARCHAR(100) NULL,
    `production_capacity` TEXT NULL,
    `invite_code` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_invite_code_key`(`invite_code`),
    INDEX `companies_type_idx`(`type`),
    INDEX `companies_name_idx`(`name`),
    INDEX `companies_invite_code_idx`(`invite_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_companies_user_id_idx`(`user_id`),
    INDEX `user_companies_company_id_idx`(`company_id`),
    UNIQUE INDEX `user_companies_user_id_company_id_key`(`user_id`, `company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partnerships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `principal_id` INTEGER NOT NULL,
    `trustee_id` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `apply_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `audit_time` DATETIME(3) NULL,
    `reject_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `partnerships_principal_id_idx`(`principal_id`),
    INDEX `partnerships_trustee_id_idx`(`trustee_id`),
    INDEX `partnerships_status_idx`(`status`),
    UNIQUE INDEX `partnerships_principal_id_trustee_id_key`(`principal_id`, `trustee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_companies` ADD CONSTRAINT `user_companies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_companies` ADD CONSTRAINT `user_companies_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partnerships` ADD CONSTRAINT `partnerships_principal_id_fkey` FOREIGN KEY (`principal_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partnerships` ADD CONSTRAINT `partnerships_trustee_id_fkey` FOREIGN KEY (`trustee_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
