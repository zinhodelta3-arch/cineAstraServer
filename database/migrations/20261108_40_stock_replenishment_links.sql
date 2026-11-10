CREATE TABLE vinculos_insumos_reposicao (
    id_vinculo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_insumo_origem INT UNSIGNED NOT NULL,
    id_local_destino INT UNSIGNED NOT NULL,
    id_insumo_destino INT UNSIGNED NOT NULL,
    CONSTRAINT uk_reposicao_origem_local UNIQUE (id_insumo_origem, id_local_destino),
    CONSTRAINT chk_reposicao_insumos_distintos CHECK (id_insumo_origem <> id_insumo_destino),
    CONSTRAINT fk_reposicao_insumo_origem FOREIGN KEY (id_insumo_origem) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_reposicao_local_destino FOREIGN KEY (id_local_destino) REFERENCES locais(id_local),
    CONSTRAINT fk_reposicao_insumo_destino FOREIGN KEY (id_insumo_destino) REFERENCES insumos(id_insumo)
) ENGINE=InnoDB;
