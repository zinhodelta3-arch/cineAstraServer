CREATE TABLE rotas_logistica (
    id_rota INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_local_origem INT UNSIGNED NOT NULL,
    id_local_destino INT UNSIGNED NOT NULL,
    distancia_km DECIMAL(8,2) NOT NULL,
    tempo_estimado_min SMALLINT UNSIGNED NOT NULL,
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT fk_rota_logistica_origem FOREIGN KEY (id_local_origem) REFERENCES locais(id_local),
    CONSTRAINT fk_rota_logistica_destino FOREIGN KEY (id_local_destino) REFERENCES locais(id_local),
    CONSTRAINT uq_rota_logistica_direcao UNIQUE (id_local_origem, id_local_destino),
    CONSTRAINT ck_rota_logistica_locais CHECK (id_local_origem <> id_local_destino),
    CONSTRAINT ck_rota_logistica_distancia CHECK (distancia_km > 0),
    CONSTRAINT ck_rota_logistica_tempo CHECK (tempo_estimado_min BETWEEN 1 AND 10080)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
