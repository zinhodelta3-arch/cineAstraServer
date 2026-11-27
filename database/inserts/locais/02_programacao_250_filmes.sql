-- Mostra CineAstra | 250 filmes já cadastrados, recuperados da carga das páginas 1 a 5.
-- Aplique depois do instalador/migração 71, dos inserts 01 e 04 do catálogo e do 01 desta pasta.
-- Execute em uma única conexão MySQL, sem --force. A seleção usa os títulos e anos exatos.
-- Se o catálogo foi instalado em outra ordem, os IDs locais podem ser diferentes.
-- Cada filme recebe uma sessão em um dos 11 locais. As datas são relativas à importação.
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';

CREATE TEMPORARY TABLE mostra250_filmes (
    ordem SMALLINT UNSIGNED PRIMARY KEY,
    id_filme INT UNSIGNED NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    ano SMALLINT UNSIGNED NULL
);
INSERT INTO mostra250_filmes VALUES
    (1, 33, 'A Viagem de Chihiro', 2001),
    (2, 2, 'Batman: O Cavaleiro das Trevas', 2008),
    (3, 3, 'Clube da Luta', 1999),
    (4, 4, 'Pulp Fiction: Tempo de Violência', 1994),
    (5, 5, 'Forrest Gump: O Contador de Histórias', 1994),
    (6, 6, 'Harry Potter e a Pedra Filosofal', 2001),
    (7, 7, 'Homem de Ferro', 2008),
    (8, 8, 'Matrix', 1999),
    (9, 9, 'O Senhor dos Anéis: A Sociedade do Anel', 2001),
    (10, 10, 'Titanic', 1997),
    (11, 11, 'O Senhor dos Anéis: O Retorno do Rei', 2003),
    (12, 12, 'O Senhor dos Anéis: As Duas Torres', 2002),
    (13, 13, 'Harry Potter e a Câmara Secreta', 2002),
    (14, 14, 'Harry Potter e o Prisioneiro de Azkaban', 2004),
    (15, 15, 'Seven: Os Sete Crimes Capitais', 1995),
    (16, 16, 'O Poderoso Chefão', 1972),
    (17, 17, 'Capitão América: O Primeiro Vingador', 2011),
    (18, 18, 'Star Wars: Uma Nova Esperança', 1977),
    (19, 19, 'Piratas do Caribe: A Maldição do Pérola Negra', 2003),
    (20, 20, 'Harry Potter e o Cálice de Fogo', 2005),
    (21, 21, 'De Volta para o Futuro', 1985),
    (22, 22, 'Gladiador', 2000),
    (23, 23, 'Harry Potter e a Ordem da Fênix', 2007),
    (24, 24, 'Harry Potter e o Enigma do Príncipe', 2009),
    (25, 25, 'Homem-Aranha', 2002),
    (26, 26, 'Procurando Nemo', 2003),
    (27, 27, 'Toy Story', 1995),
    (28, 28, 'Monstros S.A.', 2001),
    (29, 29, 'À Espera de um Milagre', 1999),
    (30, 30, 'Kill Bill: Volume 1', 2003),
    (31, 31, 'O Iluminado', 1980),
    (32, 32, 'Shrek', 2001),
    (33, 34, 'Jurassic Park: O Parque dos Dinossauros', 1993),
    (34, 35, 'O Grande Truque', 2006),
    (35, 36, 'A Lista de Schindler', 1993),
    (36, 37, 'O Resgate do Soldado Ryan', 1998),
    (37, 38, 'Piratas do Caribe: O Baú da Morte', 2006),
    (38, 39, 'Prenda-me Se For Capaz', 2002),
    (39, 40, 'Alien: O Oitavo Passageiro', 1979),
    (40, 41, 'Homem-Aranha 2', 2004),
    (41, 42, 'Brilho Eterno de uma Mente sem Lembranças', 2004),
    (42, 43, 'Amnésia', 2000),
    (43, 44, 'Os Infiltrados', 2006),
    (44, 45, 'O Profissional', 1994),
    (45, 46, 'A Fantástica Fábrica de Chocolate', 2005),
    (46, 47, 'V de Vingança', 2006),
    (47, 48, 'Cães de Aluguel', 1992),
    (48, 49, 'Homem-Aranha 3', 2007),
    (49, 50, 'Carros', 2006),
    (50, 51, 'Kill Bill: Volume 2', 2004),
    (51, 52, 'Blade Runner: O Caçador de Androides', 1982),
    (52, 53, 'Toy Story 2', 1999),
    (53, 54, 'MIB: Homens de Preto', 1997),
    (54, 55, '300', 2007),
    (55, 56, 'O Exterminador do Futuro', 1984),
    (56, 57, 'Os Bons Companheiros', 1990),
    (57, 58, 'A Era do Gelo', 2002),
    (58, 59, 'A Vida É Bela', 1997),
    (59, 60, 'O Poderoso Chefão: Parte II', 1974),
    (60, 61, 'De Volta para o Futuro II', 1989),
    (61, 62, 'Gênio Indomável', 1997),
    (62, 63, 'O Diabo Veste Prada', 2006),
    (63, 64, 'Laranja Mecânica', 1971),
    (64, 65, 'Edward Mãos de Tesoura', 1990),
    (65, 66, 'Indiana Jones e os Caçadores da Arca Perdida', 1981),
    (66, 67, 'Shrek 2', 2004),
    (67, 68, 'Taxi Driver', 1976),
    (68, 69, 'Donnie Darko', 2001),
    (69, 70, 'Scarface', 1983),
    (70, 71, 'Beleza Americana', 1999),
    (71, 72, 'O Sexto Sentido', 1999),
    (72, 73, 'O Incrível Hulk', 2008),
    (73, 74, 'Sociedade dos Poetas Mortos', 1989),
    (74, 75, '2001: Uma Odisseia no Espaço', 1968),
    (75, 76, 'A Outra História Americana', 1998),
    (76, 77, 'Onze Homens e um Segredo', 2001),
    (77, 78, 'Esqueceram de Mim', 1990),
    (78, 79, 'O Fabuloso Destino de Amélie Poulain', 2001),
    (79, 80, 'Psicopata Americano', 2000),
    (80, 81, 'Duro de Matar', 1988),
    (81, 82, 'O Grande Lebowski', 1998),
    (82, 83, 'Aladdin', 1992),
    (83, 84, 'E.T.: O Extraterrestre', 1982),
    (84, 85, 'Matrix Reloaded', 2003),
    (85, 86, 'O Quinto Elemento', 1997),
    (86, 87, 'Madagascar', 2005),
    (87, 88, 'Tubarão', 1975),
    (88, 89, 'De Volta para o Futuro III', 1990),
    (89, 90, 'As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa', 2005),
    (90, 91, 'Todo Poderoso', 2003),
    (91, 92, 'Nascido para Matar', 1987),
    (92, 93, 'O Labirinto do Fauno', 2006),
    (93, 94, 'Um Estranho no Ninho', 1975),
    (94, 95, 'Os Suspeitos', 1995),
    (95, 96, 'O Máskara', 1994),
    (96, 97, 'Sr. e Sra. Smith', 2005),
    (97, 98, 'Coração Valente', 1995),
    (98, 99, 'Troia', 2004),
    (99, 100, 'Uma Mente Brilhante', 2001),
    (100, 101, 'Indiana Jones e a Última Cruzada', 1989),
    (101, 105, 'Citizen Kane', 1941),
    (102, 106, 'Apocalypse Now', 1979),
    (103, 107, 'A History of Violence', 2005),
    (104, 108, '12 Monkeys', 1996),
    (105, 109, 'Million Dollar Baby', 2005),
    (106, 110, 'War of the Worlds', 2005),
    (107, 111, 'Before Sunrise', 1995),
    (108, 112, 'Dirty Dancing', 1987),
    (109, 113, 'Armageddon', 1998),
    (110, 114, 'Lock, Stock and Two Smoking Barrels', 1998),
    (111, 115, 'Predator', 1987),
    (112, 116, 'Snatch', 2001),
    (113, 117, 'Pretty Woman', 1990),
    (114, 118, 'Princess Mononoke', 1997),
    (115, 119, 'O Brother, Where Art Thou?', 2001),
    (116, 120, 'Groundhog Day', 1993),
    (117, 121, 'Lost in Translation', 2003),
    (118, 122, '28 Days Later', 2003),
    (119, 123, 'Saw', 2004),
    (120, 124, 'Minority Report', 2002),
    (121, 125, 'North by Northwest', 1959),
    (122, 126, 'East of Eden', 1955),
    (123, 127, 'The Outsiders', 1983),
    (124, 128, 'Stand by Me', 1986),
    (125, 129, 'Ghost', 1990),
    (126, 130, 'Willy Wonka & the Chocolate Factory', 1971),
    (127, 131, 'Batman Begins', 2005),
    (128, 132, 'The Silence of the Lambs', 1991),
    (129, 133, 'Underworld', 2003),
    (130, 134, 'The Shawshank Redemption', 1994),
    (131, 135, 'Amadeus', 1984),
    (132, 136, 'Terminator 2: Judgment Day', 1991),
    (133, 137, 'Casablanca', 1943),
    (134, 138, 'Barton Fink', 1991),
    (135, 139, 'Meet Joe Black', 1998),
    (136, 140, 'Once Upon a Time in America', 1984),
    (137, 141, 'True Romance', 1993),
    (138, 142, 'Insomnia', 2002),
    (139, 143, 'Mystic River', 2003),
    (140, 144, 'Magnolia', 2000),
    (141, 145, 'Once Upon a Time in the West', 1969),
    (142, 146, 'Eyes Wide Shut', 1999),
    (143, 147, 'Seven Samurai', 1956),
    (144, 148, 'A Nightmare on Elm Street', 1984),
    (145, 149, 'Inside Man', 2006),
    (146, 150, '12 Angry Men', 1957),
    (147, 151, 'Basic Instinct', 1992),
    (148, 152, 'La haine', 1996),
    (149, 153, 'The Pianist', 2003),
    (150, 154, 'The Good, the Bad and the Ugly', 1967),
    (151, 155, 'The Day After Tomorrow', 2004),
    (152, 156, 'Romeo + Juliet', 1996),
    (153, 157, 'Wild at Heart', 1990),
    (154, 158, 'Being John Malkovich', 1999),
    (155, 159, 'Borat', 2006),
    (156, 160, 'Love Actually', 2003),
    (157, 161, 'Casino', 1995),
    (158, 162, 'The Blues Brothers', 1980),
    (159, 163, 'Psycho', 1960),
    (160, 164, 'There''s Something About Mary', 1998),
    (161, 165, 'Constantine', 2005),
    (162, 166, 'Starship Troopers', 1997),
    (163, 167, 'The Mummy', 1999),
    (164, 168, 'The Ring', 2002),
    (165, 169, 'Rear Window', 1954),
    (166, 170, 'Dances with Wolves', 1990),
    (167, 171, 'The Lives of Others', 2007),
    (168, 172, 'Big Fish', 2004),
    (169, 173, 'Silent Hill', 2006),
    (170, 174, 'The Da Vinci Code', 2006),
    (171, 175, 'City of God', 2004),
    (172, 176, 'Independence Day', 1996),
    (173, 177, 'Poltergeist', 1982),
    (174, 178, 'The Passion of the Christ', 2004),
    (175, 179, 'The Last Samurai', 2003),
    (176, 180, 'Ghostbusters', 1984),
    (177, 181, 'Grease', 1978),
    (178, 182, 'Interview with the Vampire: The Vampire Chronicles', 1994),
    (179, 183, 'The Wizard of Oz', 1939),
    (180, 184, 'When Harry Met Sally...', 1989),
    (181, 185, 'Requiem for a Dream', 2000),
    (182, 186, 'A.I. Artificial Intelligence', 2001),
    (183, 187, 'Paris, Texas', 1984),
    (184, 188, 'Twister', 1996),
    (185, 189, 'Oldboy', 2003),
    (186, 190, 'Pearl Harbor', 2001),
    (187, 191, 'Aliens', 1986),
    (188, 192, 'Contact', 1997),
    (189, 193, 'GoldenEye', 1995),
    (190, 194, 'Top Gun', 1986),
    (191, 195, 'Shaun of the Dead', 2004),
    (192, 196, 'From Dusk Till Dawn', 1996),
    (193, 197, 'Monty Python and the Holy Grail', 1975),
    (194, 198, 'The Evil Dead', 1983),
    (195, 199, 'Gone with the Wind', 1940),
    (196, 200, 'Home Alone 2: Lost in New York', 1992),
    (197, 201, 'Little Miss Sunshine', 2006),
    (198, 202, 'Gattaca', 1997),
    (199, 203, 'Almost Famous', 2000),
    (200, 204, 'Platoon', 1986),
    (201, 205, 'Cruel Intentions', 1999),
    (202, 206, 'Rosemary''s Baby', 1968),
    (203, 207, 'Airplane!', 1980),
    (204, 208, 'Austin Powers: International Man of Mystery', 1997),
    (205, 209, 'Sleepers', 1996),
    (206, 210, 'JFK', 1991),
    (207, 211, 'The Bridge on the River Kwai', 1957),
    (208, 212, 'Chinatown', 1974),
    (209, 213, 'Dune', 1984),
    (210, 214, 'In the Mood for Love', 2001),
    (211, 215, 'Enemy at the Gates', 2001),
    (212, 216, 'Black Hawk Down', 2002),
    (213, 217, 'Sleepless in Seattle', 1993),
    (214, 218, 'Total Recall', 1990),
    (215, 219, 'Hook', 1991),
    (216, 220, 'A Few Good Men', 1992),
    (217, 221, 'Gremlins', 1984),
    (218, 222, 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb', 1964),
    (219, 223, 'Lawrence of Arabia', 1962),
    (220, 224, 'Halloween', 1978),
    (221, 225, 'Heat', 1995),
    (222, 226, 'Mission: Impossible', 1996),
    (223, 227, 'Spaceballs', 1987),
    (224, 228, 'Irreversible', 2002),
    (225, 229, 'Mulholland Drive', 2001),
    (226, 230, 'Point Break', 1991),
    (227, 231, 'The Thing', 1982),
    (228, 232, 'The Talented Mr. Ripley', 1999),
    (229, 233, 'Sunshine', 2007),
    (230, 234, 'The Dreamers', 2004),
    (231, 235, 'Rocky', 1976),
    (232, 236, 'First Blood', 1982),
    (233, 237, 'Blood Diamond', 2006),
    (234, 238, 'Stalker', 1980),
    (235, 239, 'The Pursuit of Happyness', 2006),
    (236, 240, 'Kingdom of Heaven', 2005),
    (237, 241, 'Collateral', 2004),
    (238, 242, 'Office Space', 1999),
    (239, 243, 'The Lost Boys', 1987),
    (240, 244, 'Die Hard 2', 1990),
    (241, 245, 'Resident Evil', 2002),
    (242, 246, 'Resident Evil: Apocalypse', 2004),
    (243, 247, 'Apocalypto', 2006),
    (244, 248, 'The Holiday', 2006),
    (245, 249, 'It''s a Wonderful Life', 1947),
    (246, 250, 'Bring It On', 2000),
    (247, 251, 'Primal Fear', 1996),
    (248, 252, 'Night at the Museum', 2006),
    (249, 253, 'Meet the Parents', 2000),
    (250, 254, 'Cape Fear', 1991);

CREATE TEMPORARY TABLE mostra250_validacao (
    regra VARCHAR(100) PRIMARY KEY,
    satisfeita BOOLEAN NOT NULL,
    CONSTRAINT chk_mostra250_valida CHECK (satisfeita = TRUE)
);

CREATE TEMPORARY TABLE mostra250_locais (
    ordem SMALLINT UNSIGNED PRIMARY KEY,
    slug VARCHAR(180) NOT NULL UNIQUE,
    sala VARCHAR(100) NOT NULL
);
INSERT INTO mostra250_locais VALUES
    (1, 'mostra-cineastra-estadio-tamanduatei', 'Arquibancada Norte'),
    (2, 'mostra-cineastra-teatro-bela-vista', 'Plateia Aurora'),
    (3, 'mostra-cineastra-bunker-ceramica', 'Sala Subsolo'),
    (4, 'mostra-cineastra-drive-in-interlagos', 'Pista Horizonte'),
    (5, 'mostra-cineastra-parque-celso-daniel', 'Gramado das Palmeiras'),
    (6, 'mostra-cineastra-container-porto', 'Sala Cais'),
    (7, 'mostra-cineastra-vila-madalena', 'Sala Lumière'),
    (8, 'mostra-cineastra-salao-cambui', 'Plateia Ipê'),
    (9, 'mostra-cineastra-patio-prado', 'Pátio das Estrelas'),
    (10, 'mostra-cineastra-esplanada-sao-vicente', 'Terraço das Gaivotas'),
    (11, 'mostra-cineastra-galpao-lapa', 'Nave das Lanternas');

START TRANSACTION;

-- Usa o mesmo bloqueio de local do agendamento administrativo.
SELECT l.id_local FROM locais l JOIN mostra250_locais m ON m.slug=l.slug
ORDER BY l.id_local FOR UPDATE;

CREATE TEMPORARY TABLE mostra250_salas AS
SELECT m.ordem, l.id_local, s.id_sala, s.capacidade
FROM mostra250_locais m
JOIN locais l ON l.slug=m.slug AND l.status='ATIVO'
JOIN salas s ON s.id_local=l.id_local AND s.nome=m.sala AND s.status='ATIVA'
WHERE s.cena_3d IS NOT NULL
  AND s.capacidade=(SELECT COUNT(*) FROM assentos a WHERE a.id_sala=s.id_sala AND a.status='ATIVA');

INSERT INTO mostra250_validacao
SELECT 'Onze salas ativas com modelo publicado e capacidade preenchida', COUNT(*)=11
FROM mostra250_salas;

CREATE TEMPORARY TABLE mostra250_distribuicao AS
WITH correspondencias AS (
    SELECT m.ordem,f.id_filme,f.titulo,f.duracao,f.id_filme=m.id_filme AS id_original,
           COUNT(*) OVER (PARTITION BY m.ordem) AS encontrados
    FROM mostra250_filmes m
    JOIN filmes f ON f.titulo=m.titulo AND BINARY f.titulo=BINARY m.titulo AND YEAR(f.data_lancamento)<=>m.ano
    WHERE f.status='ATIVO' AND f.disponivel_cinema=TRUE AND f.duracao BETWEEN 1 AND 270
      AND (f.data_lancamento IS NULL OR f.data_lancamento<=UTC_DATE())
)
SELECT f.ordem,f.id_filme,f.titulo,f.duracao,r.id_local,r.id_sala,r.capacidade
FROM correspondencias f JOIN mostra250_salas r ON r.ordem=MOD(f.ordem-1,11)+1
WHERE f.encontrados=1 OR f.id_original;

INSERT INTO mostra250_validacao
SELECT 'Os 250 filmes originais estão ativos no catálogo de cinema', COUNT(*)=250
FROM mostra250_distribuicao;

INSERT INTO mostra250_validacao
SELECT 'Parâmetros de preço de sessão e ofertas de filmes válidos',
       EXISTS (SELECT 1 FROM precificacao_parametros WHERE categoria='SESSION' AND ocupacao_referencia>0)
       AND NOT EXISTS (
           SELECT 1 FROM mostra250_distribuicao d JOIN ofertas_filmes_unidade o
           ON o.id_local=d.id_local AND o.id_filme=d.id_filme WHERE o.ativa=FALSE
       );

CREATE TEMPORARY TABLE mostra250_pendentes AS
SELECT d.*, ROW_NUMBER() OVER (PARTITION BY d.id_local ORDER BY d.ordem) AS vaga
FROM mostra250_distribuicao d
WHERE NOT EXISTS (
    SELECT 1 FROM sessoes x WHERE x.id_sala=d.id_sala AND x.id_filme=d.id_filme
      AND x.status IN ('AGENDADA','EM_CARTAZ') AND TIMESTAMP(x.data,x.horario_inicio)>UTC_TIMESTAMP()
);

SET @mostra250_runtime = (SELECT MAX(duracao+30) FROM mostra250_distribuicao);

-- Duas opções diárias UTC, com uma hora de intervalo após a duração máxima.
-- O agendamento desvia de outras sessões no mesmo local, inclusive em outras salas.
CREATE TEMPORARY TABLE mostra250_horarios AS
WITH RECURSIVE dias AS (
    SELECT 1 AS deslocamento
    UNION ALL SELECT deslocamento+1 FROM dias WHERE deslocamento<90
), candidatos AS (
    SELECT r.id_local, TIMESTAMP(DATE_ADD(UTC_DATE(), INTERVAL d.deslocamento DAY), h.inicio) AS inicio
    FROM mostra250_salas r CROSS JOIN dias d
    CROSS JOIN (SELECT '14:00:00' AS inicio UNION ALL SELECT '20:00:00') h
)
SELECT c.*, ROW_NUMBER() OVER (PARTITION BY c.id_local ORDER BY c.inicio) AS vaga
FROM candidatos c
WHERE NOT EXISTS (
    SELECT 1 FROM sessoes x JOIN salas s ON s.id_sala=x.id_sala
    WHERE s.id_local=c.id_local AND x.status NOT IN ('CANCELADA','INTERROMPIDA')
      AND x.data BETWEEN DATE(c.inicio)-INTERVAL 2 DAY AND DATE(c.inicio)+INTERVAL 2 DAY
      AND TIMESTAMP(x.data,x.horario_inicio)<DATE_ADD(c.inicio, INTERVAL (@mostra250_runtime+60) MINUTE)
      AND c.inicio<DATE_ADD(TIMESTAMP(DATE_ADD(x.data, INTERVAL (x.horario_fim<x.horario_inicio) DAY),x.horario_fim),INTERVAL 1 HOUR)
);

CREATE TEMPORARY TABLE mostra250_agenda AS
SELECT d.id_local,d.id_filme,d.id_sala,DATE(h.inicio) AS data,TIME(h.inicio) AS inicio,
       TIME(DATE_ADD(h.inicio, INTERVAL (d.duracao+30) MINUTE)) AS fim,
       ROUND((ROUND(8000*(d.duracao+30)/1440,0)+12000)/LEAST(d.capacidade,p.ocupacao_referencia),0) AS custo,
       p.markup_bps
FROM mostra250_pendentes d JOIN mostra250_horarios h ON h.id_local=d.id_local AND h.vaga=d.vaga
JOIN precificacao_parametros p ON p.categoria='SESSION';

INSERT INTO mostra250_validacao
SELECT 'Existe horário para cada filme pendente',
       (SELECT COUNT(*) FROM mostra250_agenda)=(SELECT COUNT(*) FROM mostra250_pendentes);

INSERT INTO ofertas_filmes_unidade (id_local,id_filme,ativa)
SELECT d.id_local,d.id_filme,TRUE FROM mostra250_distribuicao d
LEFT JOIN ofertas_filmes_unidade o ON o.id_local=d.id_local AND o.id_filme=d.id_filme
WHERE o.id_filme IS NULL;

INSERT INTO sessoes (id_filme,id_sala,data,horario_inicio,horario_fim,idioma,preco_inteira,status,custo_local_dia,custo_exibicao)
SELECT id_filme,id_sala,data,inicio,fim,'LEGENDADO',
       (custo+ROUND(custo*markup_bps/10000,0))/100,'AGENDADA',80.00,120.00
FROM mostra250_agenda ORDER BY data,inicio,id_sala;

SET @mostra250_adicionadas=ROW_COUNT();
COMMIT;

SELECT 250 AS filmes_programados,@mostra250_adicionadas AS novas_sessoes;
SELECT l.nome AS local,COUNT(DISTINCT d.id_filme) AS filmes,MIN(x.data) AS primeira_exibicao
FROM mostra250_distribuicao d JOIN locais l ON l.id_local=d.id_local
JOIN sessoes x ON x.id_sala=d.id_sala AND x.id_filme=d.id_filme
WHERE x.status IN ('AGENDADA','EM_CARTAZ') AND TIMESTAMP(x.data,x.horario_inicio)>UTC_TIMESTAMP()
GROUP BY l.id_local,l.nome ORDER BY l.nome;

DROP TEMPORARY TABLE mostra250_agenda, mostra250_horarios, mostra250_pendentes, mostra250_distribuicao,
    mostra250_salas, mostra250_locais, mostra250_validacao, mostra250_filmes;
