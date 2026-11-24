-- CineAstra | Cenário simulado para apresentação.
-- Base isolada: instalar o schema, carregar 01, 07, 08 e 09, depois executar este arquivo.
-- Os cinemas e as contas são os da carga operacional. A programação usa a data da execução.
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
START TRANSACTION;
SET @hoje_apresentacao = DATE(UTC_TIMESTAMP() - INTERVAL 3 HOUR);

CREATE TEMPORARY TABLE apresentacao_programacao (
    id_sala INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    id_equipe_origem INT UNSIGNED NOT NULL,
    dia DATE NOT NULL,
    inicio TIME NOT NULL,
    fim TIME NOT NULL,
    PRIMARY KEY (id_sala, dia, inicio)
) ENGINE=InnoDB;

INSERT INTO apresentacao_programacao (id_sala,id_local,id_filme,id_equipe_origem,dia,inicio,fim)
SELECT r.id_sala,r.id_local,f.id_filme,r.id_equipe_origem,
       DATE_ADD(@hoje_apresentacao,INTERVAL dias.numero DAY),'19:30:00',
       ADDTIME('19:30:00',SEC_TO_TIME((f.duracao + 30) * 60))
FROM (
    SELECT 900001 AS id_sala,900001 AS id_local,900001 AS id_equipe_origem,'Batman: O Cavaleiro das Trevas' AS titulo
    UNION ALL SELECT 900004,900002,900002,'A Viagem de Chihiro'
    UNION ALL SELECT 900007,900003,900003,'Homem-Aranha 2'
) r
CROSS JOIN (SELECT 2 AS numero UNION ALL SELECT 4 UNION ALL SELECT 6 UNION ALL SELECT 8) dias
JOIN salas sa ON sa.id_sala=r.id_sala AND sa.id_local=r.id_local AND sa.status='ATIVA'
JOIN locais l ON l.id_local=sa.id_local AND l.status='ATIVO' AND l.tipo_local='CINEMA'
JOIN filmes f ON f.id_filme=(SELECT MIN(c.id_filme) FROM filmes c
    WHERE c.titulo=r.titulo AND c.status='ATIVO' AND c.disponivel_cinema=TRUE AND c.trailer IS NOT NULL AND c.imagem IS NOT NULL)
WHERE EXISTS (SELECT 1 FROM assentos a WHERE a.id_sala=sa.id_sala AND a.status='ATIVA')
  AND EXISTS (SELECT 1 FROM filmes_imagens g WHERE g.id_filme=f.id_filme AND g.tipo='BANNER')
  AND NOT EXISTS (SELECT 1 FROM ofertas_filmes_unidade o WHERE o.id_local=r.id_local AND o.id_filme=f.id_filme AND o.ativa=FALSE)
  AND NOT EXISTS (SELECT 1 FROM sessoes s
    WHERE s.id_sala=r.id_sala AND s.data=DATE_ADD(@hoje_apresentacao,INTERVAL dias.numero DAY)
      AND s.status IN ('AGENDADA','EM_CARTAZ') AND s.arquivada_em IS NULL
      AND s.horario_inicio<ADDTIME('19:30:00',SEC_TO_TIME((f.duracao + 30) * 60))
      AND s.horario_fim>'19:30:00');

INSERT INTO sessoes (id_filme,id_sala,data,horario_inicio,horario_fim,idioma,preco_inteira,status,custo_local_dia,custo_exibicao)
SELECT id_filme,id_sala,dia,inicio,fim,'DUBLADO',32.00,'AGENDADA',80.00,120.00
FROM apresentacao_programacao;

INSERT INTO equipes (id_supervisor,id_sessao,nome,status)
SELECT anterior.id_supervisor,s.id_sessao,CONCAT('Mostra CineAstra · ',DATE_FORMAT(s.data,'%d/%m')),'ATIVA'
FROM apresentacao_programacao p
JOIN sessoes s ON s.id_sala=p.id_sala AND s.id_filme=p.id_filme AND s.data=p.dia AND s.horario_inicio=p.inicio AND s.status='AGENDADA'
JOIN equipes anterior ON anterior.id_equipe=p.id_equipe_origem
JOIN usuarios u ON u.id_usuario=anterior.id_supervisor AND u.tipo_usuario='SUPERVISOR' AND u.status='ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM equipes atual WHERE atual.id_sessao=s.id_sessao);

INSERT INTO equipe_membros (id_equipe,id_usuario,funcao,data_entrada,status)
SELECT atual.id_equipe,m.id_usuario,m.funcao,@hoje_apresentacao,'ATIVO'
FROM apresentacao_programacao p
JOIN sessoes s ON s.id_sala=p.id_sala AND s.id_filme=p.id_filme AND s.data=p.dia AND s.horario_inicio=p.inicio AND s.status='AGENDADA'
JOIN equipes atual ON atual.id_sessao=s.id_sessao AND atual.nome=CONCAT('Mostra CineAstra · ',DATE_FORMAT(s.data,'%d/%m'))
JOIN equipe_membros m ON m.id_equipe=p.id_equipe_origem AND m.status='ATIVO'
JOIN usuarios u ON u.id_usuario=m.id_usuario AND u.tipo_usuario='COLABORADOR' AND u.status='ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM equipe_membros novo WHERE novo.id_equipe=atual.id_equipe AND novo.id_usuario=m.id_usuario);

-- Fotos ilustrativas fechadas com a linha de produto correspondente.
UPDATE combos_imagens i JOIN combos c ON c.id_combo=i.id_combo
SET i.url='/astrasnack/combo-pipoca.webp',i.texto_alternativo='Pipoca e duas bebidas do Combo Clássico'
WHERE c.id_combo IN (900001,900004,900007) AND c.nome='Combo Clássico' AND i.tipo='PRINCIPAL'
  AND i.url='/astrasnack/cineastra-combo-classico.webp';

UPDATE insumos_imagens i JOIN insumos t ON t.id_insumo=i.id_insumo
SET i.url='/astrasnack/nachos-queijo.webp',i.texto_alternativo='Nachos dourados com molho de queijo'
WHERE t.id_insumo IN (900006,900014,900022) AND t.nome='Nachos com Queijo' AND i.tipo='PRINCIPAL'
  AND i.url='/astrasnack/cineastra-combo.webp';

INSERT INTO insumos (id_fornecedor,id_local,nome,descricao,categoria,quantidade,quantidade_minima,preco,status,custo_receita,custo_parceria,venda_avulsa,oferta_local)
SELECT f.id_fornecedor,l.id_local,'Brownie da Sessão','Brownie de chocolate servido com sorvete de baunilha e calda quente.','Doces',60,12,19.90,'DISPONIVEL',7.00,0.75,TRUE,TRUE
FROM locais l JOIN fornecedores f ON f.id_fornecedor=900001
WHERE l.id_local IN (900001,900002,900003) AND l.status='ATIVO'
  AND NOT EXISTS (SELECT 1 FROM insumos i WHERE i.id_local=l.id_local AND i.nome='Brownie da Sessão');

INSERT INTO insumos_imagens (id_insumo,tipo,url,texto_alternativo,ordem)
SELECT i.id_insumo,'PRINCIPAL','/astrasnack/brownie-cinema.webp','Brownie de chocolate com sorvete e calda',0
FROM insumos i
WHERE i.id_fornecedor=900001 AND i.id_local IN (900001,900002,900003) AND i.nome='Brownie da Sessão'
  AND NOT EXISTS (SELECT 1 FROM insumos_imagens g WHERE g.id_insumo=i.id_insumo AND g.tipo='PRINCIPAL');

SET @campanha_apresentacao=CONCAT('Mostra CineAstra · Bomboniere · ',DATE_FORMAT(@hoje_apresentacao,'%Y-%m')) COLLATE utf8mb4_unicode_ci;
INSERT INTO promocoes_precificacao (nome,categoria,desconto_bps,publico_geral,inicio,fim,ativo)
SELECT @campanha_apresentacao,'COMBO',800,TRUE,UTC_TIMESTAMP(),UTC_TIMESTAMP()+INTERVAL 21 DAY,TRUE
WHERE NOT EXISTS (SELECT 1 FROM promocoes_precificacao WHERE nome=@campanha_apresentacao AND categoria='COMBO');

INSERT INTO conteudos_promocionais (tipo,slug,ativo,dados,id_promocao)
SELECT 'banners',CONCAT('mostra-cineastra-bomboniere-',DATE_FORMAT(@hoje_apresentacao,'%Y-%m')),TRUE,
       JSON_OBJECT('title','Bomboniere da Mostra CineAstra','summary','Escolha sua unidade e consulte os preços dos combos participantes.','placement','astrasnack','tag','Campanha simulada','ctaLabel','Ver cardápio','imageUrl','/astrasnack/combo-pipoca.webp','imageAlt','Pipoca e duas bebidas'),
       p.id_promocao
FROM promocoes_precificacao p
WHERE p.id_promocao=(SELECT MIN(id_promocao) FROM promocoes_precificacao WHERE nome=@campanha_apresentacao AND categoria='COMBO')
  AND NOT EXISTS (SELECT 1 FROM conteudos_promocionais c WHERE c.tipo='banners' AND c.slug=CONCAT('mostra-cineastra-bomboniere-',DATE_FORMAT(@hoje_apresentacao,'%Y-%m')));

INSERT INTO noticias (categoria,titulo,resumo,corpo,destaque,publicado_em)
SELECT 'Comunidade','Mostra CineAstra reúne clássicos em três unidades',
       'Confira a programação simulada em São Paulo, Santo André e Campinas.',
       'Na simulação da Mostra CineAstra, as unidades Paulista, Shopping ABC e Campinas recebem clássicos em sessões noturnas. Consulte os horários atualizados em Filmes e escolha seu cinema.',
       TRUE,UTC_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM noticias WHERE categoria='Comunidade' AND titulo='Mostra CineAstra reúne clássicos em três unidades');

DROP TEMPORARY TABLE apresentacao_programacao;
COMMIT;
