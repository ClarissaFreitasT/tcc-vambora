ALTER TABLE `usuarios`
ADD COLUMN `username` VARCHAR(80) NULL AFTER `email`;

CREATE UNIQUE INDEX `usuarios_username_key`
ON `usuarios` (`username`);
