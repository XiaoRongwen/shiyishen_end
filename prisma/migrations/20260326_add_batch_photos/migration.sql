CREATE TABLE `batch_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_id` INTEGER NOT NULL,
    `category` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `batch_photos_batch_id_idx`(`batch_id`),
    INDEX `batch_photos_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `batch_photos` ADD CONSTRAINT `batch_photos_batch_id_fkey`
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
