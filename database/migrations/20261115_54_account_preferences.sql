ALTER TABLE preferencias_usuario
    MODIFY COLUMN aparencia VARCHAR(64) NOT NULL DEFAULT 'cineastra',
    ADD COLUMN acessibilidade JSON NULL,
    ADD COLUMN avatar VARCHAR(32) NULL;
