-- Favoritos pertencem ao perfil de visualização, não concedem reprodução.
CREATE TABLE streaming_favoritos (
    id_favorito BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_perfil INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_streaming_favorito_perfil_filme (id_perfil,id_filme),
    KEY idx_streaming_favorito_perfil_id (id_perfil,id_favorito),
    CONSTRAINT fk_streaming_favorito_perfil FOREIGN KEY(id_perfil) REFERENCES streaming_perfis(id_perfil) ON DELETE CASCADE,
    CONSTRAINT fk_streaming_favorito_filme FOREIGN KEY(id_filme) REFERENCES filmes(id_filme)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
