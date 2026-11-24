ALTER TABLE pedidos_presenciais
    ADD COLUMN nome_cliente VARCHAR(100) NULL;

ALTER TABLE auditoria_eventos
    ADD INDEX ix_auditoria_recurso_evento (aggregate_id, event_type, id_auditoria);
