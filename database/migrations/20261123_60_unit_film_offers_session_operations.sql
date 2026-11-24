ALTER TABLE sessoes
    MODIFY status ENUM('AGENDADA','EM_CARTAZ','ENCERRADA','CANCELADA','INTERROMPIDA') DEFAULT 'AGENDADA',
    ADD COLUMN arquivada_em DATETIME(3) NULL;

CREATE TABLE ofertas_filmes_unidade (
    id_local INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    observacao VARCHAR(300) NULL,
    PRIMARY KEY (id_local, id_filme),
    CONSTRAINT fk_oferta_filme_local FOREIGN KEY (id_local) REFERENCES locais(id_local),
    CONSTRAINT fk_oferta_filme_catalogo FOREIGN KEY (id_filme) REFERENCES filmes(id_filme)
);
