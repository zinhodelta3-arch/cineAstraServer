ALTER TABLE insumos MODIFY COLUMN id_local INT UNSIGNED NULL COMMENT 'local físico do estoque, quando vinculado';
ALTER TABLE equipamentos MODIFY COLUMN id_local INT UNSIGNED NULL;
