/*
  Warnings:

  - The values [SINGLE,BULK] on the enum `email_templates_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `email_templates` MODIFY `type` ENUM('EXPIRED_SINGLE', 'EXPIRED_BULK', 'READY_SINGLE', 'READY_BULK') NOT NULL;
