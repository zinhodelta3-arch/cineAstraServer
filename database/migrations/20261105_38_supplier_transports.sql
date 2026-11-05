CREATE TABLE fornecedor_transportes (
    id_transporte INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    identificacao VARCHAR(40) NULL,
    observacao VARCHAR(2000) NULL,
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_fornecedor_transporte_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT uq_fornecedor_transporte_identificacao UNIQUE (id_fornecedor, identificacao),
    INDEX idx_fornecedor_transportes_lista (id_fornecedor, id_transporte)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
