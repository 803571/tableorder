-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,

    UNIQUE INDEX `Category_order_key`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Menu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `CategoryID` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'FOR_SALE',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Menu` ADD CONSTRAINT `Menu_CategoryID_fkey` FOREIGN KEY (`CategoryID`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
