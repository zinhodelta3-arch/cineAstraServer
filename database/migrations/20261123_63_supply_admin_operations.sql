ALTER TABLE movimentacoes_estoque
    ADD COLUMN estorno_de BIGINT UNSIGNED NULL,
    ADD COLUMN correcao_de BIGINT UNSIGNED NULL,
    ADD CONSTRAINT uq_movimento_estorno UNIQUE (estorno_de),
    ADD CONSTRAINT fk_movimento_estorno FOREIGN KEY (estorno_de) REFERENCES movimentacoes_estoque(id_movimentacao),
    ADD CONSTRAINT fk_movimento_correcao FOREIGN KEY (correcao_de) REFERENCES movimentacoes_estoque(id_movimentacao);

ALTER TABLE solicitacoes_estoque
    MODIFY status ENUM('PENDENTE','APROVADA','RECUSADA','FINALIZADA','CANCELADA') DEFAULT 'PENDENTE';

CREATE TABLE empresas_fornecedoras (
    id_empresa INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(150) NOT NULL,
    nome_cine VARCHAR(150) NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE
);

INSERT INTO empresas_fornecedoras (id_empresa, razao_social, nome_cine, cnpj)
    SELECT f.id_fornecedor, f.razao_social, f.nome_cine, keys_by_cnpj.cnpj_normalizado
    FROM fornecedores f
    JOIN (
        SELECT MIN(src.id_fornecedor) AS id_fornecedor, src.cnpj_normalizado
        FROM (
            SELECT id_fornecedor,
                UPPER(REPLACE(REPLACE(REPLACE(REPLACE(cnpj,'.',''),'/',''),'-',''),' ','')) AS cnpj_normalizado
            FROM fornecedores
        ) src GROUP BY src.cnpj_normalizado
    ) keys_by_cnpj ON keys_by_cnpj.id_fornecedor=f.id_fornecedor;

ALTER TABLE fornecedores
    DROP INDEX cnpj,
    ADD COLUMN id_empresa INT UNSIGNED NULL,
    ADD CONSTRAINT fk_fornecedores_empresa FOREIGN KEY (id_empresa) REFERENCES empresas_fornecedoras(id_empresa);

UPDATE fornecedores f JOIN empresas_fornecedoras e
    ON e.cnpj=UPPER(REPLACE(REPLACE(REPLACE(REPLACE(f.cnpj,'.',''),'/',''),'-',''),' ',''))
    SET f.id_empresa=e.id_empresa;

ALTER TABLE fornecedores DROP INDEX uk_fornecedores_cnpj_normalizado;
