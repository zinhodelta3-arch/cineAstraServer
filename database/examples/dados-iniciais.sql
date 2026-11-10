-- Associações dos filmes de streaming quando o catálogo de apresentação já estiver presente.
INSERT INTO filme_generos (id_filme, id_genero)
SELECT f.id_filme, g.id_genero
FROM filmes f JOIN generos g ON g.nome = 'Ação'
WHERE f.titulo = 'Eclipse Carmesim' AND f.status = 'ATIVO' AND g.status = 'ATIVO'
  AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
INSERT INTO filme_generos (id_filme, id_genero)
SELECT f.id_filme, g.id_genero
FROM filmes f JOIN generos g ON g.nome = 'Ficção Científica'
WHERE f.titulo = 'Eclipse Carmesim' AND f.status = 'ATIVO' AND g.status = 'ATIVO'
  AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
INSERT INTO filme_generos (id_filme, id_genero)
SELECT f.id_filme, g.id_genero
FROM filmes f JOIN generos g ON g.nome = 'Drama'
WHERE f.titulo = 'O Último Farol' AND f.status = 'ATIVO' AND g.status = 'ATIVO'
  AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
INSERT INTO filme_generos (id_filme, id_genero)
SELECT f.id_filme, g.id_genero
FROM filmes f JOIN generos g ON g.nome = 'Animação'
WHERE f.titulo = 'Pequenos Heróis do Mar' AND f.status = 'ATIVO' AND g.status = 'ATIVO'
  AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
INSERT INTO filme_generos (id_filme, id_genero)
SELECT f.id_filme, g.id_genero
FROM filmes f JOIN generos g ON g.nome = 'Documentário'
WHERE f.titulo = 'Vozes do Sertão' AND f.status = 'ATIVO' AND g.status = 'ATIVO'
  AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);

-- Conta de validação do streaming. Credenciais: usuariotesteStreaming.txt.
INSERT INTO usuarios (nome, email, senha, cpf, data_nascimento, tipo_usuario, status)
SELECT 'Cliente Streaming TCC', 'streaming.tcc.mvy1swu5@cineastra.example', '$2b$12$T7qqW8YWrpzPVPU/iH/FhueP6d3UvkI53nzopqWxtrMRmJOw.vt4e', '90229367051', '1995-06-15', 'CLIENTE', 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email_normalizado = 'streaming.tcc.mvy1swu5@cineastra.example' OR cpf_normalizado = '90229367051');
INSERT INTO streaming_perfis (id_usuario, nome, nome_chave, avatar, infantil, selecionado)
SELECT u.id_usuario, 'Meu cinema', 'meu cinema', 'astronauta', FALSE, TRUE FROM usuarios u
WHERE u.email_normalizado = 'streaming.tcc.mvy1swu5@cineastra.example' AND NOT EXISTS (SELECT 1 FROM streaming_perfis p WHERE p.id_usuario = u.id_usuario AND p.nome_chave = 'meu cinema');
INSERT INTO streaming_favoritos (id_perfil, id_filme)
SELECT p.id_perfil, f.id_filme FROM streaming_perfis p
JOIN usuarios u ON u.id_usuario = p.id_usuario AND u.email_normalizado = 'streaming.tcc.mvy1swu5@cineastra.example'
JOIN filmes f ON f.titulo IN ('Eclipse Carmesim', 'O Último Farol') AND f.disponivel_streaming = TRUE
WHERE p.nome_chave = 'meu cinema' AND NOT EXISTS (SELECT 1 FROM streaming_favoritos sf WHERE sf.id_perfil = p.id_perfil AND sf.id_filme = f.id_filme);
INSERT INTO streaming_progresso (id_perfil, id_filme, posicao_segundos, duracao_segundos, concluido, versao)
SELECT p.id_perfil, f.id_filme, 120, f.duracao * 60, FALSE, 1 FROM streaming_perfis p
JOIN usuarios u ON u.id_usuario = p.id_usuario AND u.email_normalizado = 'streaming.tcc.mvy1swu5@cineastra.example'
JOIN filmes f ON f.titulo = 'Eclipse Carmesim' AND f.disponivel_streaming = TRUE AND f.duracao * 60 >= 120
WHERE p.nome_chave = 'meu cinema' AND NOT EXISTS (SELECT 1 FROM streaming_progresso sp WHERE sp.id_perfil = p.id_perfil AND sp.id_filme = f.id_filme);

-- Planos representativos para apresentação e contratação pelo fluxo normal.
INSERT INTO planos (nome, descricao, valor_mensal, valor_anual, limite_membros, acesso_catalogo, custo_beneficios_mensal, custo_beneficios_anual, combo_gratis_mes, ativo)
SELECT 'Básico', 'Sua experiência no cinema com 5% de desconto em ingressos. Plano individual.', 19.90, 199.00, 1, FALSE, 10.00, 100.00, 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = 'Básico');

INSERT INTO planos (nome, descricao, valor_mensal, valor_anual, limite_membros, acesso_catalogo, custo_beneficios_mensal, custo_beneficios_anual, combo_gratis_mes, ativo)
SELECT 'Família', 'Compartilhe o cinema com até 4 membros, 10% de desconto em ingressos e 5% em combos.', 39.90, 399.00, 4, FALSE, 20.00, 200.00, 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = 'Família');

INSERT INTO planos (nome, descricao, valor_mensal, valor_anual, limite_membros, acesso_catalogo, custo_beneficios_mensal, custo_beneficios_anual, combo_gratis_mes, ativo)
SELECT 'Plus', 'Cinema e streaming para até 4 membros, com acesso ao catálogo, 15% de desconto em ingressos e 10% em combos.', 59.90, 599.00, 4, TRUE, 30.00, 300.00, 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = 'Plus');

INSERT INTO plano_beneficios (id_plano, categoria, desconto_bps)
SELECT p.id_plano, b.categoria, b.desconto_bps
FROM planos p
JOIN (
    SELECT 'Básico' AS nome, 'SESSION' AS categoria, 500 AS desconto_bps
    UNION ALL SELECT 'Família', 'SESSION', 1000
    UNION ALL SELECT 'Família', 'COMBO', 500
    UNION ALL SELECT 'Plus', 'SESSION', 1500
    UNION ALL SELECT 'Plus', 'COMBO', 1000
) b ON b.nome = p.nome
WHERE NOT EXISTS (SELECT 1 FROM plano_beneficios pb WHERE pb.id_plano = p.id_plano AND pb.categoria = b.categoria);

-- Concessão anual do Plus à conta indicada, sem renovação automática ou cobrança.
-- Em uma instalação nova, aplica-se somente se a conta já estiver cadastrada.
INSERT INTO assinaturas (id_usuario, id_plano, inicio, fim, periodicidade, tipo_divisao, status, renovacao_automatica, chave_contratacao, contratacao_hash, contrato_snapshot, preco_contratado, limite_membros_contratado)
SELECT u.id_usuario, p.id_plano, UTC_DATE(), DATE_SUB(DATE_ADD(UTC_DATE(), INTERVAL 1 YEAR), INTERVAL 1 DAY),
       'ANUAL', 'TITULAR_PAGA', 'ATIVA', FALSE, 'concessao-plus-kevin-20261102', SHA2('concessao-plus-kevin-20261102', 256),
       JSON_OBJECT('id', CAST(p.id_plano AS CHAR), 'name', p.nome, 'description', p.descricao,
                   'monthlyPrice', CAST(p.valor_mensal AS CHAR), 'annualPrice', CAST(p.valor_anual AS CHAR),
                   'maxMembers', p.limite_membros, 'catalogAccess', JSON_EXTRACT('true', '$'),
                   'freeComboId', NULL, 'freeCombosPerMonth', 0,
                   'discounts', JSON_OBJECT('SESSION', 1500, 'COMBO', 1000), 'active', JSON_EXTRACT('true', '$')),
       p.valor_anual, p.limite_membros
FROM usuarios u JOIN planos p ON p.nome = 'Plus' AND p.ativo = TRUE AND p.acesso_catalogo = TRUE
WHERE u.email_normalizado = 'kevinvoa@gmail.com' AND u.tipo_usuario = 'CLIENTE' AND u.status = 'ATIVO'
  AND NOT EXISTS (SELECT 1 FROM assinaturas a WHERE a.id_usuario = u.id_usuario
                 AND (a.chave_contratacao = 'concessao-plus-kevin-20261102'
                      OR (a.status IN ('PENDENTE', 'ATIVA') AND (a.fim IS NULL OR a.fim >= UTC_DATE()))));

INSERT INTO assinatura_cobrancas (id_assinatura, id_usuario, competencia, valor_devido, status, data_vencimento)
SELECT a.id_assinatura, a.id_usuario, DATE_FORMAT(a.inicio, '%Y-%m-01'), 0.00, 'ISENTO', a.inicio
FROM assinaturas a JOIN usuarios u ON u.id_usuario = a.id_usuario
WHERE u.email_normalizado = 'kevinvoa@gmail.com' AND a.chave_contratacao = 'concessao-plus-kevin-20261102'
  AND NOT EXISTS (SELECT 1 FROM assinatura_cobrancas ac WHERE ac.id_assinatura = a.id_assinatura);

-- Filme real do catálogo: imagens promocionais Disney/Pixar e trailer oficial.
-- Fontes: https://www.disney.com.br/filmes/divertidamente-2
-- https://www.youtube.com/watch?v=yAZxx8t9zig
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Divertida Mente 2', 'Riley entra na adolescência e suas emoções precisam dividir a sala de comando com Ansiedade, Inveja, Tédio e Vergonha. Uma nova fase muda a forma como ela enxerga a si mesma.', 96, 'L', '2024-06-20', 'Kelsey Mann', '/images/streaming/divertida-mente-2/poster.jpg', 'https://www.youtube.com/watch?v=yAZxx8t9zig', FALSE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo = 'Divertida Mente 2');

UPDATE filmes SET imagem = '/images/streaming/divertida-mente-2/poster.jpg', trailer = 'https://www.youtube.com/watch?v=yAZxx8t9zig', disponivel_streaming = TRUE, status = 'ATIVO'
WHERE titulo = 'Divertida Mente 2';

INSERT INTO filmes_imagens (id_filme, tipo, url, texto_alternativo, ordem, principal)
SELECT f.id_filme, i.tipo, i.url, i.texto, i.ordem, FALSE
FROM filmes f JOIN (
    SELECT 'CAPA' AS tipo, '/images/streaming/divertida-mente-2/poster.jpg' AS url, 'Pôster oficial de Divertida Mente 2, Disney/Pixar' AS texto, 0 AS ordem
    UNION ALL SELECT 'BANNER', '/images/streaming/divertida-mente-2/banner.jpg', 'Personagens de Divertida Mente 2 em arte oficial Disney/Pixar', 0
    UNION ALL SELECT 'ALTERNATIVA', '/images/streaming/divertida-mente-2/cena.jpg', 'Arte promocional de Divertida Mente 2, Disney/Pixar', 1
) i ON TRUE
WHERE f.titulo = 'Divertida Mente 2'
  AND NOT EXISTS (SELECT 1 FROM filmes_imagens fi WHERE fi.id_filme = f.id_filme AND fi.url = i.url);

INSERT INTO filme_generos (id_filme, id_genero)
SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Comédia') AND g.status = 'ATIVO'
WHERE f.titulo = 'Divertida Mente 2'
  AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
