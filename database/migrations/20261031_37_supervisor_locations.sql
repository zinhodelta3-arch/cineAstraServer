-- Cada supervisor administra um local. O vínculo de equipe continua na sessão.
CREATE TABLE supervisor_locais (
    id_supervisor INT UNSIGNED NOT NULL PRIMARY KEY,
    id_local INT UNSIGNED NOT NULL,
    atribuido_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_supervisor_locais_local (id_local),
    CONSTRAINT fk_supervisor_locais_usuario FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_supervisor_locais_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);
