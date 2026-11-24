-- CineAstra | Experiências do catálogo simulado.
-- Execute depois de 01_inserts.sql ou da carga operacional complementar.
-- As solicitações seguem para triagem até que uma unidade seja definida.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO conteudos_promocionais (tipo, slug, ativo, dados)
SELECT 'experiences', 'bunker-privativo', TRUE, JSON_OBJECT(
    'title', 'Bunker Privativo',
    'summary', 'Uma sala de cinema reservada só para o seu grupo, com telão, som de cinema e poltronas confortáveis.',
    'description', 'Escolha o horário e organize uma sessão com amigos ou familiares. Na solicitação de orçamento, informe a programação que você tem em mente e se quer opções de bomboniere.',
    'imageUrl', '/experiencias/bunker-privativo.webp',
    'imageAlt', 'Sala privativa com sofá, tela de cinema e luz indireta. Imagem ilustrativa.',
    'tag', 'Sessão exclusiva',
    'details', JSON_ARRAY('Sala reservada para o grupo', 'Sessão, aniversário ou encontro', 'Data e programação combinadas no orçamento')
)
WHERE NOT EXISTS (
    SELECT 1 FROM conteudos_promocionais WHERE tipo = 'experiences' AND slug = 'bunker-privativo'
);

INSERT INTO conteudos_promocionais (tipo, slug, ativo, dados)
SELECT 'experiences', 'sala-playground', TRUE, JSON_OBJECT(
    'title', 'Sala Playground',
    'summary', 'Um espaço recreativo coberto com escorregadores, piscina de bolinhas e área para comemorações.',
    'description', 'Planeje um aniversário ou passeio em família. Informe a faixa etária das crianças, o número de participantes e a data desejada para a equipe preparar o orçamento.',
    'imageUrl', '/experiencias/sala-playground.webp',
    'imageAlt', 'Playground coberto com escorregadores coloridos. Imagem ilustrativa.',
    'tag', 'Recreação infantil',
    'details', JSON_ARRAY('Brinquedos em espaço coberto', 'Opção para aniversários e grupos', 'Reserva planejada conforme a faixa etária')
)
WHERE NOT EXISTS (
    SELECT 1 FROM conteudos_promocionais WHERE tipo = 'experiences' AND slug = 'sala-playground'
);

-- Atualiza somente as fotos de exemplo anteriores e preserva escolhas do Admin.
UPDATE conteudos_promocionais
SET dados=JSON_SET(dados,'$.imageUrl',CONCAT('/experiencias/',slug,'.webp'),'$.imageAlt',
    CASE slug WHEN 'sala-vip' THEN 'Sala reservada com poltronas de couro. Imagem ilustrativa.'
        WHEN 'bunker-privativo' THEN 'Sala privativa com sofá e tela de cinema. Imagem ilustrativa.'
        ELSE 'Playground coberto com escorregadores coloridos. Imagem ilustrativa.' END)
WHERE tipo='experiences' AND (
    (slug='sala-vip' AND (JSON_UNQUOTE(JSON_EXTRACT(dados,'$.imageUrl'))='/parcerias/sala-cinema.jpg'
        OR JSON_EXTRACT(dados,'$.imageUrl') IS NULL))
    OR (slug='bunker-privativo' AND JSON_UNQUOTE(JSON_EXTRACT(dados,'$.imageUrl'))='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&h=600&q=80')
    OR (slug='sala-playground' AND JSON_UNQUOTE(JSON_EXTRACT(dados,'$.imageUrl'))='https://images.unsplash.com/photo-1731927322028-3b64f3479e6d?auto=format&fit=crop&w=1000&h=600&q=80')
);

COMMIT;
