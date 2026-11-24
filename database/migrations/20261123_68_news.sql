CREATE TABLE noticias (
    id_noticia INT UNSIGNED NOT NULL AUTO_INCREMENT,
    categoria ENUM('Parcerias','Transmissões','Comunidade','Avisos') NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    resumo VARCHAR(400) NOT NULL,
    corpo TEXT NOT NULL,
    destaque TINYINT(1) NOT NULL DEFAULT 0,
    publicado_em DATETIME(3) NULL,
    arquivado_em DATETIME(3) NULL,
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id_noticia),
    KEY idx_noticias_publicas (arquivado_em, publicado_em, id_noticia),
    CHECK (destaque IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
