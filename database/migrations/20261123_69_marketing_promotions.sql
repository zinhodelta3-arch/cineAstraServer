ALTER TABLE conteudos_promocionais
    ADD COLUMN id_promocao INT UNSIGNED NULL,
    ADD CONSTRAINT fk_marketing_promocao FOREIGN KEY (id_promocao) REFERENCES promocoes_precificacao(id_promocao);
