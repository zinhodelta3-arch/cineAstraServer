CREATE TABLE streaming_progresso (
    id_progresso BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_perfil INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    posicao_segundos INT UNSIGNED NOT NULL,
    duracao_segundos INT UNSIGNED NOT NULL,
    concluido BOOLEAN NOT NULL DEFAULT FALSE,
    versao INT UNSIGNED NOT NULL DEFAULT 1,
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_streaming_progresso_perfil_filme (id_perfil,id_filme),
    KEY idx_streaming_progresso_recente (id_perfil,atualizado_em,id_progresso),
    CONSTRAINT chk_streaming_progresso_posicao CHECK (duracao_segundos>0 AND posicao_segundos<=duracao_segundos),
    CONSTRAINT fk_streaming_progresso_perfil FOREIGN KEY(id_perfil) REFERENCES streaming_perfis(id_perfil) ON DELETE CASCADE,
    CONSTRAINT fk_streaming_progresso_filme FOREIGN KEY(id_filme) REFERENCES filmes(id_filme)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
