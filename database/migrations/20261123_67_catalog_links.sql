ALTER TABLE filmes ADD COLUMN slug VARCHAR(180) NULL, ADD UNIQUE KEY uq_filmes_slug (slug);
ALTER TABLE locais ADD COLUMN slug VARCHAR(180) NULL, ADD UNIQUE KEY uq_locais_slug (slug);
