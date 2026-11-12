CREATE TABLE destinacoes_sociais (
    id_destinacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instituicao VARCHAR(150) NOT NULL,
    categoria ENUM('CARIDADE','ONG','EMPRESA_VULNERAVEL') NOT NULL,
    descricao VARCHAR(1000) NOT NULL,
    finalidade VARCHAR(500) NOT NULL,
    recurso VARCHAR(150),
    valor DECIMAL(12,2),
    referencia_contabil VARCHAR(150),
    revisao INT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT chk_destinacao_valor CHECK (
        (valor IS NULL AND referencia_contabil IS NULL) OR
        (valor IS NOT NULL AND valor > 0 AND recurso IS NOT NULL AND referencia_contabil IS NOT NULL)
    )
) ENGINE=InnoDB;

CREATE TABLE destinacoes_sociais_historico (
    id_destinacao BIGINT UNSIGNED NOT NULL,
    revisao INT UNSIGNED NOT NULL,
    id_admin INT UNSIGNED NOT NULL,
    dados JSON NOT NULL,
    registrado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id_destinacao,revisao),
    FOREIGN KEY (id_destinacao) REFERENCES destinacoes_sociais(id_destinacao),
    FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
