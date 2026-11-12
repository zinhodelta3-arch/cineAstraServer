ALTER TABLE solicitacoes_estoque
    ADD COLUMN status_supervisao ENUM('PENDENTE','APROVADA','RECUSADA') NULL,
    ADD COLUMN id_supervisor_decisao INT UNSIGNED NULL,
    ADD COLUMN data_decisao_supervisao DATETIME(3) NULL,
    ADD CONSTRAINT fk_solicitacao_supervisor_decisao
        FOREIGN KEY (id_supervisor_decisao) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
