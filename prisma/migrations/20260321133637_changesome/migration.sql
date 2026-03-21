/*
  Warnings:

  - You are about to drop the column `certificateUrl` on the `equipments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `equipments` DROP COLUMN `certificateUrl`;

-- CreateTable
CREATE TABLE `sukets` (
    `id` VARCHAR(191) NOT NULL,
    `equipmentId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sukets_equipmentId_idx`(`equipmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `laporans` (
    `id` VARCHAR(191) NOT NULL,
    `equipmentId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `laporans_equipmentId_idx`(`equipmentId`),
    UNIQUE INDEX `laporans_equipmentId_period_key`(`equipmentId`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sukets` ADD CONSTRAINT `sukets_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `equipments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laporans` ADD CONSTRAINT `laporans_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `equipments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
