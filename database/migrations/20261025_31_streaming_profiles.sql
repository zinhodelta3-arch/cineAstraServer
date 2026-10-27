-- Perfis de visualização pertencem à conta; não são usuários nem dependentes.
CREATE TABLE streaming_perfis (
    id_perfil INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    nome VARCHAR(24) NOT NULL,
    nome_chave VARBINARY(192) NOT NULL,
    avatar ENUM('astronauta','gato','lua','pipoca','fantasma','robo','raposa','estrela') NOT NULL DEFAULT 'astronauta',
    infantil BOOLEAN NOT NULL DEFAULT FALSE,
    selecionado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_streaming_perfil_nome (id_usuario,nome_chave),
    CONSTRAINT fk_streaming_perfil_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
