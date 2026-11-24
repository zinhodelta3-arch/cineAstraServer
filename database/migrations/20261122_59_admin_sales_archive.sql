ALTER TABLE pedidos
    ADD COLUMN arquivado_admin_em DATETIME(3) NULL,
    ADD INDEX idx_pedidos_arquivo_admin (arquivado_admin_em, id_pedido);

ALTER TABLE pagamentos
    ADD COLUMN arquivado_admin_em DATETIME(3) NULL,
    ADD INDEX idx_pagamentos_arquivo_admin (arquivado_admin_em, id_pagamento);

ALTER TABLE reembolso_solicitacoes
    ADD COLUMN arquivado_admin_em DATETIME(3) NULL,
    ADD INDEX idx_reembolsos_arquivo_admin (arquivado_admin_em, id_reembolso);
