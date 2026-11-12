ALTER TABLE pedidos
    ADD COLUMN proposta_admin JSON NULL;

CREATE TABLE pagamento_notas_admin (
    id_nota BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pagamento BIGINT UNSIGNED NOT NULL,
    id_admin INT UNSIGNED NOT NULL,
    nota VARCHAR(1000) NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_pagamento_notas_historico (id_pagamento,id_nota),
    CONSTRAINT fk_pagamento_nota_pagamento FOREIGN KEY (id_pagamento) REFERENCES pagamentos(id_pagamento),
    CONSTRAINT fk_pagamento_nota_admin FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
