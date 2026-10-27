CREATE TABLE conteudos_promocionais (
 id_conteudo INT UNSIGNED NOT NULL AUTO_INCREMENT,
 tipo ENUM('partners','experiences','banners') NOT NULL,
 slug VARCHAR(100) NOT NULL,
 ativo BOOLEAN NOT NULL DEFAULT FALSE,
 dados JSON NOT NULL,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (id_conteudo),
 UNIQUE KEY uq_promocional_slug (tipo, slug),
 KEY idx_promocional_publico (tipo, ativo, id_conteudo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
