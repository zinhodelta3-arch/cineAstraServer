-- CineAstra | Insumos avulsos nos 11 locais da mostra.
-- Aplique após o catálogo do AstraSnack e o 01_locais_sessoes_2d_3d.sql.
-- Execute em uma única conexão MySQL, sem --force. Os saldos novos são simulados.
SET NAMES utf8mb4;

CREATE TEMPORARY TABLE mostra_insumo_validacao (
    regra VARCHAR(100) PRIMARY KEY,
    satisfeita BOOLEAN NOT NULL,
    CONSTRAINT chk_mostra_insumo_valido CHECK (satisfeita = TRUE)
);
CREATE TEMPORARY TABLE mostra_insumo_destinos (slug VARCHAR(180) PRIMARY KEY);
INSERT INTO mostra_insumo_destinos VALUES
    ('mostra-cineastra-bunker-ceramica'),
    ('mostra-cineastra-container-porto'),
    ('mostra-cineastra-drive-in-interlagos'),
    ('mostra-cineastra-esplanada-sao-vicente'),
    ('mostra-cineastra-estadio-tamanduatei'),
    ('mostra-cineastra-galpao-lapa'),
    ('mostra-cineastra-parque-celso-daniel'),
    ('mostra-cineastra-patio-prado'),
    ('mostra-cineastra-salao-cambui'),
    ('mostra-cineastra-teatro-bela-vista'),
    ('mostra-cineastra-vila-madalena');

START TRANSACTION;

SELECT l.id_local FROM locais l JOIN mostra_insumo_destinos d ON d.slug=l.slug
ORDER BY l.id_local FOR UPDATE;

INSERT INTO mostra_insumo_validacao
SELECT 'Os onze locais da mostra estão ativos', COUNT(*)=11
FROM mostra_insumo_destinos d JOIN locais l ON l.slug=d.slug AND l.status='ATIVO';

-- Une os catálogos das três unidades originais. Para um item repetido,
-- prefere os dados do Paulista, depois Shopping ABC e Campinas.
CREATE TEMPORARY TABLE mostra_insumo_catalogo AS
WITH referencias AS (
    SELECT i.id_insumo,i.id_fornecedor,i.nome,i.descricao,i.categoria,i.quantidade_minima,
           i.preco,i.custo_receita,i.custo_parceria,
           GREATEST(1,i.quantidade-i.quantidade_reservada,i.quantidade_minima) AS saldo_inicial,
           ROW_NUMBER() OVER (
               PARTITION BY LOWER(TRIM(i.nome)),LOWER(TRIM(COALESCE(i.categoria,'')))
               ORDER BY FIELD(l.nome,'CineAstra Paulista','CineAstra Shopping ABC','CineAstra Campinas'),i.id_insumo
           ) AS prioridade
    FROM insumos i
    JOIN locais l ON l.id_local=i.id_local AND l.status='ATIVO'
    JOIN fornecedores f ON f.id_fornecedor=i.id_fornecedor AND f.status='ATIVO'
    JOIN usuarios u ON u.id_usuario=f.id_usuario AND u.status='ATIVO' AND u.tipo_usuario='FORNECEDOR'
    JOIN fornecedor_locais fl ON fl.id_fornecedor=f.id_fornecedor AND fl.id_local=l.id_local AND fl.status='ATIVO'
    WHERE l.nome IN ('CineAstra Paulista','CineAstra Shopping ABC','CineAstra Campinas')
      AND i.status='DISPONIVEL' AND i.venda_avulsa=TRUE AND i.oferta_local=TRUE AND i.preco>0
)
SELECT * FROM referencias WHERE prioridade=1;

INSERT INTO mostra_insumo_validacao
SELECT 'As unidades de referência têm insumos avulsos ativos', COUNT(*)>0 FROM mostra_insumo_catalogo;

-- A mesma chave de nome e categoria usada no Admin preserva itens já cadastrados.
CREATE TEMPORARY TABLE mostra_insumo_pendentes AS
SELECT l.id_local,c.*
FROM mostra_insumo_destinos d JOIN locais l ON l.slug=d.slug
CROSS JOIN mostra_insumo_catalogo c
WHERE NOT EXISTS (
    SELECT 1 FROM insumos i WHERE i.id_local=l.id_local
      AND LOWER(TRIM(i.nome))=LOWER(TRIM(c.nome))
      AND LOWER(TRIM(COALESCE(i.categoria,'')))=LOWER(TRIM(COALESCE(c.categoria,'')))
);

INSERT INTO mostra_insumo_validacao
SELECT 'Os fornecedores da carga não têm vínculo inativo com o destino',
       NOT EXISTS (
           SELECT 1 FROM mostra_insumo_pendentes p JOIN fornecedor_locais fl
           ON fl.id_fornecedor=p.id_fornecedor AND fl.id_local=p.id_local
           WHERE fl.status='INATIVO'
       );

INSERT INTO fornecedor_locais (id_fornecedor,id_local,status)
SELECT DISTINCT p.id_fornecedor,p.id_local,'ATIVO'
FROM mostra_insumo_pendentes p
LEFT JOIN fornecedor_locais fl ON fl.id_fornecedor=p.id_fornecedor AND fl.id_local=p.id_local
WHERE fl.id_fornecedor IS NULL;

INSERT INTO insumos (id_fornecedor,id_local,nome,descricao,categoria,quantidade,quantidade_reservada,
                     quantidade_minima,preco,custo_receita,custo_parceria,venda_avulsa,oferta_local,status)
SELECT id_fornecedor,id_local,nome,descricao,categoria,saldo_inicial,0,
       quantidade_minima,preco,custo_receita,custo_parceria,TRUE,TRUE,'DISPONIVEL'
FROM mostra_insumo_pendentes ORDER BY id_local,id_insumo;
SET @mostra_insumos_inseridos=ROW_COUNT();

INSERT INTO insumos_imagens (id_insumo,tipo,url,texto_alternativo,ordem)
SELECT destino.id_insumo,im.tipo,im.url,im.texto_alternativo,im.ordem
FROM mostra_insumo_pendentes p
JOIN insumos destino ON destino.id_local=p.id_local AND destino.id_fornecedor=p.id_fornecedor
    AND destino.nome=p.nome AND destino.categoria<=>p.categoria
JOIN insumos_imagens im ON im.id_insumo=p.id_insumo
ORDER BY destino.id_insumo,im.ordem,im.id_imagem;

COMMIT;

SELECT (SELECT COUNT(*) FROM mostra_insumo_catalogo) AS produtos_de_referencia,
       @mostra_insumos_inseridos AS novos_insumos;
SELECT l.nome,COUNT(p.id_insumo) AS novos_insumos
FROM mostra_insumo_destinos d JOIN locais l ON l.slug=d.slug
LEFT JOIN mostra_insumo_pendentes p ON p.id_local=l.id_local
GROUP BY l.id_local,l.nome ORDER BY l.nome;

DROP TEMPORARY TABLE mostra_insumo_pendentes,mostra_insumo_catalogo,
    mostra_insumo_destinos,mostra_insumo_validacao;
