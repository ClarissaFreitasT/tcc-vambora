-- AlterTable
ALTER TABLE `roteiros` ADD COLUMN `cidades` JSON NULL,
    ADD COLUMN `data_ida` DATE NULL,
    ADD COLUMN `data_volta` DATE NULL,
    ADD COLUMN `pessoas` INTEGER NULL,
    ADD COLUMN `revisao` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `dias_do_roteiro` ADD COLUMN `cidade_principal` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `planejamentos_ia` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `roteiro_id` CHAR(36) NULL,
    `dados_iniciais` JSON NOT NULL,
    `gerando_ate` DATETIME(3) NULL,
    `operacao_atual` CHAR(36) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `planejamentos_ia_roteiro_id_key`(`roteiro_id`),
    INDEX `planejamentos_ia_usuario_id_atualizado_em_idx`(`usuario_id`, `atualizado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensagens_ia` (
    `id` CHAR(36) NOT NULL,
    `planejamento_id` CHAR(36) NOT NULL,
    `papel` VARCHAR(20) NOT NULL,
    `texto` TEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mensagens_ia_planejamento_id_criado_em_idx`(`planejamento_id`, `criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `propostas_ia` (
    `id` CHAR(36) NOT NULL,
    `planejamento_id` CHAR(36) NOT NULL,
    `conteudo` JSON NOT NULL,
    `resumo` TEXT NOT NULL,
    `revisao_base` INTEGER NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'pendente',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `propostas_ia_planejamento_id_estado_idx`(`planejamento_id`, `estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operacoes_ia` (
    `id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,
    `planejamento_id` CHAR(36) NULL,
    `chave` VARCHAR(80) NOT NULL,
    `hash` CHAR(64) NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'processando',
    `erro` VARCHAR(255) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operacoes_ia_usuario_id_criado_em_idx`(`usuario_id`, `criado_em`),
    UNIQUE INDEX `operacoes_ia_usuario_id_chave_key`(`usuario_id`, `chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `planejamentos_ia` ADD CONSTRAINT `planejamentos_ia_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planejamentos_ia` ADD CONSTRAINT `planejamentos_ia_roteiro_id_fkey` FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagens_ia` ADD CONSTRAINT `mensagens_ia_planejamento_id_fkey` FOREIGN KEY (`planejamento_id`) REFERENCES `planejamentos_ia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `propostas_ia` ADD CONSTRAINT `propostas_ia_planejamento_id_fkey` FOREIGN KEY (`planejamento_id`) REFERENCES `planejamentos_ia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operacoes_ia` ADD CONSTRAINT `operacoes_ia_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operacoes_ia` ADD CONSTRAINT `operacoes_ia_planejamento_id_fkey` FOREIGN KEY (`planejamento_id`) REFERENCES `planejamentos_ia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
