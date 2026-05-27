-- CreateTable
CREATE TABLE `usuarios` (
    `id` CHAR(36) NOT NULL,
    `nome` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `foto_url` VARCHAR(255) NULL,
    `bio` TEXT NULL,
    `personalidade` ENUM('AVENTUREIRA', 'CULTURAL', 'FESTEIRA', 'TRANQUILA') NULL,
    `orcamento_perfil` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roteiros` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `roteiro_original_id` CHAR(36) NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `descricao` TEXT NULL,
    `destino` VARCHAR(255) NOT NULL,
    `orcamento` DECIMAL(10, 2) NULL,
    `publico` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `roteiros_usuario_id_idx`(`usuario_id`),
    INDEX `roteiros_roteiro_original_id_idx`(`roteiro_original_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dias_do_roteiro` (
    `id` CHAR(36) NOT NULL,
    `roteiro_id` CHAR(36) NOT NULL,
    `numero_dia` INTEGER NOT NULL,
    `titulo` VARCHAR(255) NULL,

    INDEX `dias_do_roteiro_roteiro_id_idx`(`roteiro_id`),
    UNIQUE INDEX `dias_do_roteiro_roteiro_id_numero_dia_key`(`roteiro_id`, `numero_dia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_do_roteiro` (
    `id` CHAR(36) NOT NULL,
    `dia_id` CHAR(36) NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `descricao` TEXT NULL,
    `local_nome` VARCHAR(255) NULL,
    `custo_estimado` DECIMAL(10, 2) NULL,
    `horario_inicio` TIME(0) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    INDEX `itens_do_roteiro_dia_id_idx`(`dia_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favoritos` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `roteiro_id` CHAR(36) NOT NULL,

    INDEX `favoritos_usuario_id_idx`(`usuario_id`),
    INDEX `favoritos_roteiro_id_idx`(`roteiro_id`),
    UNIQUE INDEX `favoritos_usuario_id_roteiro_id_key`(`usuario_id`, `roteiro_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` CHAR(36) NOT NULL,
    `nome` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `categorias_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roteiro_categorias` (
    `roteiro_id` CHAR(36) NOT NULL,
    `categoria_id` CHAR(36) NOT NULL,

    INDEX `roteiro_categorias_categoria_id_idx`(`categoria_id`),
    PRIMARY KEY (`roteiro_id`, `categoria_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `roteiro_id` CHAR(36) NOT NULL,
    `nota` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reviews_usuario_id_idx`(`usuario_id`),
    INDEX `reviews_roteiro_id_idx`(`roteiro_id`),
    UNIQUE INDEX `reviews_usuario_id_roteiro_id_key`(`usuario_id`, `roteiro_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roteiros` ADD CONSTRAINT `roteiros_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roteiros` ADD CONSTRAINT `roteiros_roteiro_original_id_fkey` FOREIGN KEY (`roteiro_original_id`) REFERENCES `roteiros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dias_do_roteiro` ADD CONSTRAINT `dias_do_roteiro_roteiro_id_fkey` FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_do_roteiro` ADD CONSTRAINT `itens_do_roteiro_dia_id_fkey` FOREIGN KEY (`dia_id`) REFERENCES `dias_do_roteiro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favoritos` ADD CONSTRAINT `favoritos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favoritos` ADD CONSTRAINT `favoritos_roteiro_id_fkey` FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roteiro_categorias` ADD CONSTRAINT `roteiro_categorias_roteiro_id_fkey` FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roteiro_categorias` ADD CONSTRAINT `roteiro_categorias_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_roteiro_id_fkey` FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
