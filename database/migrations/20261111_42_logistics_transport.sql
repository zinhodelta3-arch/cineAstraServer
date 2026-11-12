ALTER TABLE logistica
    ADD COLUMN id_transporte INT UNSIGNED NULL,
    ADD COLUMN transporte_em_uso INT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN status IN ('ENVIADO','EM_TRANSITO') THEN id_transporte ELSE NULL END
    ) STORED,
    ADD CONSTRAINT uk_logistica_transporte_em_uso UNIQUE (transporte_em_uso),
    ADD CONSTRAINT fk_logistica_transporte FOREIGN KEY (id_transporte) REFERENCES fornecedor_transportes(id_transporte);

CREATE TABLE logistica_eventos (
    id_evento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_logistica INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('STATUS','ACIDENTE','EXTRAVIO','PERDA') NOT NULL,
    status ENUM('PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO','CANCELADO','DEVOLVIDO') NOT NULL,
    descricao VARCHAR(2000) NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_logistica_eventos_historico (id_logistica,id_evento),
    CONSTRAINT fk_logistica_evento_envio FOREIGN KEY (id_logistica) REFERENCES logistica(id_logistica),
    CONSTRAINT fk_logistica_evento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
