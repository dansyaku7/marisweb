-- CreateTable
CREATE TABLE `email_templates` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `type` ENUM('SINGLE', 'BULK') NOT NULL,
    `senderName` VARCHAR(191) NOT NULL DEFAULT 'M-Track Marusindo',
    `subject` TEXT NOT NULL,
    `introText` TEXT NOT NULL,
    `footerText` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `email_templates_companyId_idx`(`companyId`),
    UNIQUE INDEX `email_templates_companyId_type_key`(`companyId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `email_templates` ADD CONSTRAINT `email_templates_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
