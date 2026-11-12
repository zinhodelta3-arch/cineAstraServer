ALTER TABLE filmes_imagens
    ADD COLUMN contexto_banner ENUM('GERAL','CINEMA_HOME','CINEMA_FILME','STREAMING_HOME') NOT NULL DEFAULT 'GERAL',
    ADD COLUMN dispositivo_banner ENUM('PADRAO','DESKTOP','TABLET','MOBILE') NOT NULL DEFAULT 'PADRAO',
    ADD KEY idx_filmes_imagens_banner (id_filme,tipo,contexto_banner,dispositivo_banner,principal,ordem,id_imagem),
    ADD CONSTRAINT chk_filmes_imagens_banner CHECK (
        (contexto_banner='GERAL' AND dispositivo_banner='PADRAO')
        OR (tipo='BANNER' AND contexto_banner<>'GERAL' AND dispositivo_banner<>'PADRAO' AND principal=FALSE)
    );
