ALTER TABLE reembolso_solicitacoes
    ADD COLUMN itens_selecionados JSON NULL,
    MODIFY COLUMN status ENUM('RECEBIDA','EM_ANALISE','ENVIADA','CONFIRMADA','NEGADA','FALHOU','CANCELADA') NOT NULL DEFAULT 'RECEBIDA';

ALTER TABLE pedidos
    ADD COLUMN cancelado_por_admin INT UNSIGNED NULL,
    ADD COLUMN motivo_cancelamento_admin VARCHAR(1000) NULL,
    ADD CONSTRAINT fk_pedido_cancelado_admin FOREIGN KEY (cancelado_por_admin) REFERENCES usuarios(id_usuario);
