-- Community post media, categories, saved items and report records.

CREATE TABLE `publicacoes_fotos` (
    `id` CHAR(36) NOT NULL,
    `publicacao_id` CHAR(36) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    INDEX `publicacoes_fotos_publicacao_id_ordem_idx`(`publicacao_id`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `publicacoes_categorias` (
    `publicacao_id` CHAR(36) NOT NULL,
    `categoria_id` CHAR(36) NOT NULL,
    INDEX `publicacoes_categorias_categoria_id_publicacao_id_idx`(`categoria_id`, `publicacao_id`),
    PRIMARY KEY (`publicacao_id`, `categoria_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `publicacoes_salvas` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `publicacao_id` CHAR(36) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `publicacoes_salvas_usuario_id_criado_em_idx`(`usuario_id`, `criado_em`),
    UNIQUE INDEX `publicacoes_salvas_usuario_id_publicacao_id_key`(`usuario_id`, `publicacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `denuncias_publicacoes` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `publicacao_id` CHAR(36) NULL,
    `motivo` VARCHAR(80) NOT NULL,
    `detalhe` TEXT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ABERTA',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `denuncias_publicacoes_estado_criado_em_idx`(`estado`, `criado_em`),
    INDEX `denuncias_publicacoes_publicacao_id_idx`(`publicacao_id`),
    UNIQUE INDEX `denuncias_publicacoes_usuario_id_publicacao_id_key`(`usuario_id`, `publicacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `publicacoes_criado_em_id_idx` ON `publicacoes`(`criado_em`, `id`);

ALTER TABLE `publicacoes_fotos`
    ADD CONSTRAINT `publicacoes_fotos_publicacao_id_fkey`
    FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `publicacoes_categorias`
    ADD CONSTRAINT `publicacoes_categorias_publicacao_id_fkey`
    FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `publicacoes_categorias_categoria_id_fkey`
    FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `publicacoes_salvas`
    ADD CONSTRAINT `publicacoes_salvas_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `publicacoes_salvas_publicacao_id_fkey`
    FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `denuncias_publicacoes`
    ADD CONSTRAINT `denuncias_publicacoes_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `denuncias_publicacoes_publicacao_id_fkey`
    FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT IGNORE INTO `categorias` (`id`, `nome`) VALUES
    (UUID(), 'Dicas'),
    (UUID(), 'Roteiros'),
    (UUID(), 'Destinos');
