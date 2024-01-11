-- AlterTable
ALTER TABLE `Menu` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `isDeleted` DATETIME(3) NULL;
