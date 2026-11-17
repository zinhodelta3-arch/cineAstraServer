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
    'imageUrl', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&h=600&q=80',
    'imageAlt', 'Poltronas em uma sala de cinema com iluminação baixa',
    'tag', 'Sessão exclusiva',
    'details', JSON_ARRAY('Sala reservada para o grupo', 'Sessão, aniversário ou encontro', 'Data e programação combinadas no orçamento')
)
WHERE NOT EXISTS (
    SELECT 1 FROM conteudos_promocionais WHERE tipo = 'experiences' AND slug = 'bunker-privativo'
);

-- Foto ilustrativa do playground: https://unsplash.com/photos/uFs7-IC5Ggw
INSERT INTO conteudos_promocionais (tipo, slug, ativo, dados)
SELECT 'experiences', 'sala-playground', TRUE, JSON_OBJECT(
    'title', 'Sala Playground',
    'summary', 'Um espaço recreativo coberto com escorregadores, piscina de bolinhas e área para comemorações.',
    'description', 'Planeje um aniversário ou passeio em família. Informe a faixa etária das crianças, o número de participantes e a data desejada para a equipe preparar o orçamento.',
    'imageUrl', 'https://images.unsplash.com/photo-1731927322028-3b64f3479e6d?auto=format&fit=crop&w=1000&h=600&q=80',
    'imageAlt', 'Escorregadores coloridos sobre uma piscina de bolinhas',
    'tag', 'Recreação infantil',
    'details', JSON_ARRAY('Brinquedos em espaço coberto', 'Opção para aniversários e grupos', 'Reserva planejada conforme a faixa etária')
)
WHERE NOT EXISTS (
    SELECT 1 FROM conteudos_promocionais WHERE tipo = 'experiences' AND slug = 'sala-playground'
);

COMMIT;
