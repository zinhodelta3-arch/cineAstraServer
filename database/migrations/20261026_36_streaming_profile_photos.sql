-- Uma foto normalizada por perfil; a exclusão do perfil remove seus bytes.
CREATE TABLE streaming_perfil_fotos (
 id_perfil INT UNSIGNED NOT NULL PRIMARY KEY,
 imagem MEDIUMBLOB NOT NULL,
 largura SMALLINT UNSIGNED NOT NULL,
 altura SMALLINT UNSIGNED NOT NULL,
 atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 CONSTRAINT fk_perfil_foto FOREIGN KEY (id_perfil) REFERENCES streaming_perfis(id_perfil) ON DELETE CASCADE,
 CONSTRAINT chk_perfil_foto_bytes CHECK (OCTET_LENGTH(imagem) BETWEEN 1 AND 262144),
 CONSTRAINT chk_perfil_foto_dim CHECK (largura BETWEEN 1 AND 512 AND altura BETWEEN 1 AND 512)
) ENGINE=InnoDB;
