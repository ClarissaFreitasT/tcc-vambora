-- Additive migration for the social/community features in the current Prisma schema.

CREATE TABLE `seguidores` (
    `id` CHAR(36) NOT NULL,
    `seguidor_id` CHAR(36) NOT NULL,
    `seguido_id` CHAR(36) NOT NULL,

    INDEX `seguidores_seguidor_id_idx`(`seguidor_id`),
    INDEX `seguidores_seguido_id_idx`(`seguido_id`),
    UNIQUE INDEX `seguidores_seguidor_id_seguido_id_key`(`seguidor_id`, `seguido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `publicacoes` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `roteiro_id` CHAR(36) NULL,
    `texto` TEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `publicacoes_usuario_id_idx`(`usuario_id`),
    INDEX `publicacoes_roteiro_id_idx`(`roteiro_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `comentarios` (
    `id` CHAR(36) NOT NULL,
    `texto` TEXT NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `publicacao_id` CHAR(36) NOT NULL,
    `comentario_pai_id` CHAR(36) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comentarios_publicacao_id_idx`(`publicacao_id`),
    INDEX `comentarios_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `curtidas_publicacao` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `publicacao_id` CHAR(36) NOT NULL,

    UNIQUE INDEX `curtidas_publicacao_usuario_id_publicacao_id_key`(`usuario_id`, `publicacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `roteiros_salvos` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `roteiro_id` CHAR(36) NOT NULL,

    INDEX `roteiros_salvos_usuario_id_idx`(`usuario_id`),
    INDEX `roteiros_salvos_roteiro_id_idx`(`roteiro_id`),
    UNIQUE INDEX `roteiros_salvos_usuario_id_roteiro_id_key`(`usuario_id`, `roteiro_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `seguidores`
    ADD CONSTRAINT `seguidores_seguidor_id_fkey`
    FOREIGN KEY (`seguidor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `seguidores_seguido_id_fkey`
    FOREIGN KEY (`seguido_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `publicacoes`
    ADD CONSTRAINT `publicacoes_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `publicacoes_roteiro_id_fkey`
    FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `comentarios`
    ADD CONSTRAINT `comentarios_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `comentarios_publicacao_id_fkey`
    FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `comentarios_comentario_pai_id_fkey`
    FOREIGN KEY (`comentario_pai_id`) REFERENCES `comentarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `curtidas_publicacao`
    ADD CONSTRAINT `curtidas_publicacao_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `curtidas_publicacao_publicacao_id_fkey`
    FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `roteiros_salvos`
    ADD CONSTRAINT `roteiros_salvos_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `roteiros_salvos_roteiro_id_fkey`
    FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
