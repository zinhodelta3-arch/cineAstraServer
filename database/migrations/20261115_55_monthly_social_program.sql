CREATE TABLE iniciativas_sociais_mensais (
    id_iniciativa BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    competencia DATE NOT NULL UNIQUE,
    id_destinacao BIGINT UNSIGNED NOT NULL,
    instituicao VARCHAR(150) NOT NULL,
    categoria ENUM('CARIDADE','ONG','EMPRESA_VULNERAVEL') NOT NULL,
    descricao VARCHAR(1000) NOT NULL,
    finalidade VARCHAR(500) NOT NULL,
    comprovacao_url VARCHAR(2048) NULL,
    simulado BOOLEAN NOT NULL,
    publicado_em DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    FOREIGN KEY (id_destinacao) REFERENCES destinacoes_sociais(id_destinacao),
    CHECK (DAYOFMONTH(competencia)=1)
);

CREATE TABLE destinacao_social_pedidos (
    id_pedido BIGINT UNSIGNED PRIMARY KEY,
    id_pagamento BIGINT UNSIGNED NOT NULL UNIQUE,
    id_iniciativa BIGINT UNSIGNED NOT NULL,
    base_valor DECIMAL(10,2) NOT NULL,
    taxa_bps SMALLINT UNSIGNED NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    capturado_em DATETIME(3) NOT NULL,
    INDEX ix_social_captura_data (capturado_em),
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_pagamento) REFERENCES pagamentos(id_pagamento),
    FOREIGN KEY (id_iniciativa) REFERENCES iniciativas_sociais_mensais(id_iniciativa),
    CHECK (base_valor > 0 AND taxa_bps BETWEEN 1 AND 10000 AND valor >= 0)
);

CREATE TABLE destinacao_social_ajustes (
    id_reembolso BIGINT UNSIGNED PRIMARY KEY,
    id_pedido BIGINT UNSIGNED NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    registrado_em DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX ix_social_ajuste_data (registrado_em),
    FOREIGN KEY (id_reembolso) REFERENCES reembolso_solicitacoes(id_reembolso),
    FOREIGN KEY (id_pedido) REFERENCES destinacao_social_pedidos(id_pedido),
    CHECK (valor >= 0)
);
