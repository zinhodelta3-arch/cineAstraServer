ALTER TABLE assinaturas
    ADD COLUMN encerramento_admin_em DATE NULL,
    ADD COLUMN proposta_admin JSON NULL;

ALTER TABLE assinatura_ciclos
    ADD COLUMN beneficios_snapshot JSON NULL;

ALTER TABLE convites_plano
    ADD COLUMN expira_em DATETIME(3) NULL,
    ADD KEY idx_convites_plano_expiracao (status, expira_em, id_assinatura);

ALTER TABLE assinatura_cobrancas
    MODIFY COLUMN status ENUM('PENDENTE','PAGO','ATRASADO','ISENTO','CANCELADO') DEFAULT 'PENDENTE';

UPDATE planos SET nome='Essencial', descricao='Benefícios em ingressos e no AstraSnack.' WHERE nome='Família';
