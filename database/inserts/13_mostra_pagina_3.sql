-- CineAstra | programação simulada: página 3 de 5, com até 50 filmes.
-- Execute os cinco arquivos em ordem, uma vez e sem --force, em uma base de apresentação.
-- Requer o instalador atualizado e os arquivos 01, 04 e 08. O arquivo 05 de volume é dispensável.
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
START TRANSACTION;
SET @comprador = 900011;
SET @pix = (SELECT MIN(id_metodo) FROM metodos_pagamento WHERE id_usuario=@comprador AND tipo='PIX' AND ativo=TRUE);

CREATE TEMPORARY TABLE mostra_validacao (ok TINYINT NOT NULL CHECK (ok = 1));
INSERT INTO mostra_validacao VALUES (@pix IS NOT NULL AND EXISTS (
    SELECT 1 FROM usuarios WHERE id_usuario=@comprador AND tipo_usuario='CLIENTE' AND status='ATIVO'
      AND data_nascimento<=UTC_DATE()-INTERVAL 18 YEAR
));

-- O primeiro arquivo publica os modelos 3D desta programação.
CREATE TEMPORARY TABLE mostra_salas AS
SELECT sa.id_sala, sa.id_local, sa.capacidade,
       ROW_NUMBER() OVER (ORDER BY sa.id_local) - 1 AS posicao
FROM salas sa JOIN locais l ON l.id_local=sa.id_local
WHERE sa.id_sala IN (900001,900004,900007) AND sa.status='ATIVA'
  AND l.status='ATIVO' AND l.tipo_local='CINEMA'
  AND sa.cena_3d IS NOT NULL
  AND (SELECT COUNT(*) FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA') >= 2
  AND NOT EXISTS (
    SELECT 1 FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA' AND NOT EXISTS (
      SELECT 1 FROM JSON_TABLE(sa.cena_3d,'$.objects[*]' COLUMNS (assento VARCHAR(10) PATH '$.seatId')) j
      WHERE j.assento=CAST(a.id_assento AS CHAR)
    )
  )
  AND (SELECT COUNT(*) FROM JSON_TABLE(sa.cena_3d,'$.objects[*]' COLUMNS (
    assento VARCHAR(10) PATH '$.seatId'
  )) j WHERE j.assento IS NOT NULL) = (SELECT COUNT(*) FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA');

INSERT INTO mostra_validacao SELECT COUNT(*)=3 FROM mostra_salas;

-- Mesmos filtros da aba Em cartaz, sem busca nem gênero. A página prioriza filmes com venda.
CREATE TEMPORARY TABLE mostra_pagina AS
SELECT f.id_filme, f.duracao
FROM filmes f
WHERE f.status='ATIVO' AND f.disponivel_cinema=TRUE
  AND (f.data_lancamento IS NULL OR f.data_lancamento<=UTC_DATE())
ORDER BY EXISTS (
    SELECT 1 FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala JOIN locais l ON l.id_local=sa.id_local
    WHERE s.id_filme=f.id_filme AND s.status IN ('AGENDADA','EM_CARTAZ') AND sa.status='ATIVA' AND l.status='ATIVO'
      AND TIMESTAMP(s.data,s.horario_inicio)>UTC_TIMESTAMP(3)
      AND EXISTS (
          SELECT 1 FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA'
            AND NOT EXISTS (SELECT 1 FROM assento_ocupacoes o
                WHERE o.id_sessao=s.id_sessao AND o.id_assento=a.id_assento
                  AND (o.estado='CONFIRMADA' OR (o.estado='RESERVADA' AND o.expira_em>UTC_TIMESTAMP(3))))
      )
) DESC, f.id_filme
LIMIT 50 OFFSET 100;

INSERT INTO mostra_validacao
SELECT COUNT(*)=50 AND MIN(duracao)>0 AND MAX(duracao)<=1350 FROM mostra_pagina;

SET @dia_inicial = (
    SELECT GREATEST(UTC_DATE() + INTERVAL 2 DAY,
           COALESCE(MAX(DATE_ADD(data,INTERVAL (1+(horario_fim<horario_inicio)) DAY)),UTC_DATE()))
    FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala
    WHERE sa.id_local IN (900001,900002,900003) AND s.status<>'CANCELADA' AND s.data>=UTC_DATE()
);
SET @slots_dia = (SELECT IF(MAX(duracao)<=330,2,1) FROM mostra_pagina);

CREATE TEMPORARY TABLE mostra_programacao AS
WITH pendentes AS (
    SELECT f.*, ROW_NUMBER() OVER (ORDER BY f.id_filme)-1 AS posicao
    FROM mostra_pagina f
    WHERE NOT EXISTS (SELECT 1 FROM pedidos p WHERE p.id_usuario=@comprador AND p.checkout_key=CONCAT('mostra-250:',f.id_filme))
), agenda AS (
    SELECT f.id_filme, m.id_sala, m.id_local, m.capacidade, f.duracao,
           DATE_ADD(@dia_inicial,INTERVAL (f.posicao DIV (3*@slots_dia)) DAY) AS dia,
           IF(MOD(f.posicao DIV 3,@slots_dia)=0, '10:00:00','17:00:00') AS inicio
    FROM pendentes f JOIN mostra_salas m ON m.posicao=MOD(f.posicao,3)
), precos AS (
    SELECT a.*,
           SEC_TO_TIME(MOD(TIME_TO_SEC(a.inicio)+(a.duracao+30)*60,86400)) AS fim,
           ROUND((ROUND(8000*(a.duracao+30)/1440,0)+12000)/LEAST(a.capacidade,p.ocupacao_referencia),0) AS custo,
           p.markup_bps
    FROM agenda a JOIN precificacao_parametros p ON p.categoria='SESSION'
)
SELECT p.id_filme,p.id_sala,p.id_local,p.dia,p.inicio,p.fim,
       (p.custo + ROUND(p.custo*p.markup_bps/10000,0))/100 AS preco,
       CONCAT('mostra-250:',p.id_filme) AS chave,
       (SELECT MIN(a.id_assento) FROM assentos a WHERE a.id_sala=p.id_sala AND a.status='ATIVA' AND a.tipo='COMUM') AS id_assento
FROM precos p;

INSERT INTO mostra_validacao
SELECT NOT EXISTS (
    SELECT 1 FROM mostra_programacao p LEFT JOIN ofertas_filmes_unidade o
      ON o.id_filme=p.id_filme AND o.id_local=p.id_local AND o.ativa=FALSE
    WHERE o.id_filme IS NOT NULL OR p.id_assento IS NULL OR p.preco<=0
)
  AND EXISTS (SELECT 1 FROM precificacao_parametros WHERE categoria='SESSION' AND ocupacao_referencia>0);

INSERT INTO ofertas_filmes_unidade (id_local,id_filme,ativa)
SELECT p.id_local,p.id_filme,TRUE
FROM mostra_programacao p
WHERE NOT EXISTS (SELECT 1 FROM ofertas_filmes_unidade o WHERE o.id_local=p.id_local AND o.id_filme=p.id_filme);

INSERT INTO sessoes (id_filme,id_sala,data,horario_inicio,horario_fim,idioma,preco_inteira,status,custo_local_dia,custo_exibicao)
SELECT id_filme,id_sala,dia,inicio,fim,'LEGENDADO',preco,'AGENDADA',80.00,120.00
FROM mostra_programacao ORDER BY dia,inicio,id_sala;

INSERT INTO pedidos (id_usuario,status,valor_total,checkout_key,checkout_hash,checkout_expira_em)
SELECT @comprador,'PAGO',preco,chave,SHA2(chave,256),UTC_TIMESTAMP(3)+INTERVAL 15 MINUTE
FROM mostra_programacao;

CREATE TEMPORARY TABLE mostra_vendas AS
SELECT p.*,s.id_sessao,o.id_pedido,
       TIMESTAMP(DATE_ADD(p.dia,INTERVAL (p.fim<p.inicio) DAY),p.fim) AS expira_ingresso
FROM mostra_programacao p JOIN pedidos o ON o.id_usuario=@comprador AND o.checkout_key=p.chave
JOIN sessoes s ON s.id_sala=p.id_sala AND s.id_filme=p.id_filme AND s.data=p.dia AND s.horario_inicio=p.inicio;

INSERT INTO itens_pedido (id_pedido,id_sessao,id_assento,tipo_ingresso,quantidade,valor_unitario,subtotal)
SELECT id_pedido,id_sessao,id_assento,'INTEIRA',1,preco,preco FROM mostra_vendas;

INSERT INTO pagamento_intencoes (id_usuario,chave_idempotencia,id_pedido,id_metodo,valor,estado,provider,provider_ref,ultimo_evento_em)
SELECT @comprador,chave,id_pedido,@pix,preco,'CONCILIADA','SIMULATED',chave,UTC_TIMESTAMP(3)
FROM mostra_vendas;

INSERT INTO pagamentos (id_pedido,id_metodo,valor,status,data_pagamento,transacao_id,id_intencao)
SELECT v.id_pedido,@pix,v.preco,'APROVADO',UTC_TIMESTAMP(),v.chave,i.id_intencao
FROM mostra_vendas v JOIN pagamento_intencoes i ON i.id_pedido=v.id_pedido;

INSERT INTO assento_ocupacoes (id_sessao,id_assento,id_pedido,id_item,estado)
SELECT v.id_sessao,v.id_assento,v.id_pedido,i.id_item,'CONFIRMADA'
FROM mostra_vendas v JOIN itens_pedido i ON i.id_pedido=v.id_pedido;

INSERT INTO tickets (id_item,codigo,tipo,status,expira_em)
SELECT i.id_item,LOWER(HEX(RANDOM_BYTES(24))),'INGRESSO_SESSAO','GERADO',v.expira_ingresso
FROM mostra_vendas v JOIN itens_pedido i ON i.id_pedido=v.id_pedido;

SELECT 3 AS pagina,COUNT(*) AS sessoes_criadas,COUNT(*) AS ingressos_simulados
FROM mostra_vendas;
COMMIT;
