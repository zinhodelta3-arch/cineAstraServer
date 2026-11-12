ALTER TABLE combos
    ADD COLUMN id_evento INT UNSIGNED NULL,
    ADD COLUMN id_sessao_evento INT UNSIGNED NULL,
    ADD COLUMN limite_evento INT UNSIGNED NULL,
    ADD COLUMN limite_cliente_evento INT UNSIGNED NULL,
    ADD CONSTRAINT fk_combo_evento FOREIGN KEY (id_evento) REFERENCES conteudos_promocionais(id_conteudo),
    ADD CONSTRAINT fk_combo_sessao_evento FOREIGN KEY (id_sessao_evento) REFERENCES sessoes(id_sessao),
    ADD CONSTRAINT chk_combo_limites_evento CHECK (
      (id_evento IS NULL AND id_sessao_evento IS NULL AND limite_evento IS NULL AND limite_cliente_evento IS NULL)
      OR (id_evento IS NOT NULL AND id_sessao_evento IS NOT NULL AND limite_evento IS NOT NULL
        AND limite_cliente_evento IS NOT NULL AND limite_evento BETWEEN 1 AND 100000
        AND limite_cliente_evento BETWEEN 1 AND 100 AND limite_cliente_evento <= limite_evento)
    );
