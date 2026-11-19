ALTER TABLE solicitacoes_experiencia
    MODIFY COLUMN id_experiencia INT UNSIGNED NULL,
    ADD COLUMN requisitos_estrutura TEXT NULL AFTER preferencias;
