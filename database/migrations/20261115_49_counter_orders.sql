CREATE TABLE pedidos_presenciais (
    id_pedido BIGINT UNSIGNED PRIMARY KEY,
    id_sessao INT UNSIGNED NOT NULL,
    id_operador INT UNSIGNED NOT NULL,
    chave VARCHAR(120) COLLATE utf8mb4_bin NOT NULL,
    hash_pedido CHAR(64) NOT NULL,
    canal ENUM('BALCAO','APP') NOT NULL,
    CONSTRAINT fk_presencial_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_presencial_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_presencial_operador FOREIGN KEY (id_operador) REFERENCES usuarios(id_usuario),
    UNIQUE KEY uk_presencial_operador_chave (id_operador,chave),
    KEY ix_presencial_sessao (id_sessao,id_pedido)
);
