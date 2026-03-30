-- CreateTable
CREATE TABLE `batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchNo` VARCHAR(50) NOT NULL,
    `productName` VARCHAR(100) NOT NULL,
    `productBatchNo` VARCHAR(50) NOT NULL,
    `componentName` VARCHAR(100) NOT NULL,
    `componentBatchNo` VARCHAR(50) NOT NULL,
    `auditStatus` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `auditRemark` VARCHAR(500) NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `batches_batchNo_key`(`batchNo`),
    INDEX `batches_user_id_idx`(`user_id`),
    INDEX `batches_auditStatus_idx`(`auditStatus`),
    INDEX `batches_productName_idx`(`productName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
