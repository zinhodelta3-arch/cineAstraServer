ALTER TABLE locais
    ADD COLUMN tipo_local ENUM('CINEMA','DRIVE_IN','SALAO_EVENTOS','ESTACIONAMENTO','ESTADIO','PRACA','ESPACO_PUBLICO','OUTRO') NOT NULL DEFAULT 'CINEMA',
    ADD COLUMN lotacao_eventos INT UNSIGNED NULL,
    ADD COLUMN acesso_eventos ENUM('NUMERADO','LIVRE') NULL,
    ADD CONSTRAINT chk_locais_lotacao_eventos CHECK (lotacao_eventos IS NULL OR lotacao_eventos BETWEEN 1 AND 100000);

ALTER TABLE conteudos_promocionais
    ADD COLUMN id_local_evento INT UNSIGNED NULL,
    ADD CONSTRAINT fk_conteudo_local_evento FOREIGN KEY (id_local_evento) REFERENCES locais(id_local),
    ADD CONSTRAINT chk_conteudo_local_evento CHECK (id_local_evento IS NULL OR tipo='experiences');
