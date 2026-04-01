-- AlterTable
ALTER TABLE `laporans` ADD COLUMN `documentType` ENUM('UPLOAD', 'LINK') NOT NULL DEFAULT 'UPLOAD';

-- AlterTable
ALTER TABLE `sukets` ADD COLUMN `documentType` ENUM('UPLOAD', 'LINK') NOT NULL DEFAULT 'UPLOAD';
