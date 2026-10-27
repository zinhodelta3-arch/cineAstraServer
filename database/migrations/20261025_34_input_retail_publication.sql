-- Opt-in: nenhum insumo legado é publicado automaticamente para venda avulsa.
ALTER TABLE insumos ADD COLUMN venda_avulsa BOOLEAN NOT NULL DEFAULT FALSE;
