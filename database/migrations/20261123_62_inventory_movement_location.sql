ALTER TABLE movimentacoes_estoque
    ADD COLUMN id_local_movimentacao INT UNSIGNED NULL,
    ADD CONSTRAINT fk_movimentacao_local FOREIGN KEY (id_local_movimentacao) REFERENCES locais(id_local);
