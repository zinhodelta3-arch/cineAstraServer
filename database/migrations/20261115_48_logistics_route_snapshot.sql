ALTER TABLE logistica
    ADD COLUMN id_rota_referencia INT UNSIGNED NULL,
    ADD COLUMN distancia_rota_km DECIMAL(8,2) NULL,
    ADD COLUMN tempo_rota_min SMALLINT UNSIGNED NULL,
    ADD CONSTRAINT fk_logistica_rota_referencia FOREIGN KEY (id_rota_referencia) REFERENCES rotas_logistica(id_rota),
    ADD CONSTRAINT chk_logistica_rota_referencia CHECK (
        (id_rota_referencia IS NULL AND distancia_rota_km IS NULL AND tempo_rota_min IS NULL)
        OR (id_rota_referencia IS NOT NULL AND distancia_rota_km IS NOT NULL AND tempo_rota_min IS NOT NULL)
    );
