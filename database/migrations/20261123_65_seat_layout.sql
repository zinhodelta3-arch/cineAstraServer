ALTER TABLE assentos
    ADD COLUMN posicao_visual INT UNSIGNED NULL,
    ADD COLUMN posicao_mapa INT UNSIGNED GENERATED ALWAYS AS (COALESCE(posicao_visual, numero)) STORED,
    ADD UNIQUE KEY uk_assento_posicao (id_sala, fileira, posicao_mapa);
