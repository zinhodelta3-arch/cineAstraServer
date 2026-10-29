-- CineAstra: dados de demonstração; 5 usuários e 5 filmes.
-- Execute após as migrations, selecionando seu banco no comando mysql.
-- Senhas e instruções: docs/INSERTS-EXEMPLO.md.
-- Não altera usuários existentes, senhas, permissões ou filmes existentes.
-- Reexecução sequencial ignora e-mails/CPFs e títulos já presentes.
-- Não use --force. Em erro interativo, execute ROLLBACK.
SET NAMES utf8mb4;
START TRANSACTION;

-- USUÁRIOS: hashes bcrypt; nenhum aceite ou verificação de idade é inventado.
INSERT INTO usuarios (nome, email, senha, cpf, data_nascimento, tipo_usuario, status)
SELECT 'Admin Demonstração', 'admin.demo@cineastra.example', '$2b$12$m/R8XD/XLLYl4d52lObD1.xTTYAnMgNwvKasAJJEH./Psc43kfvDy', '90000000001', '1990-01-15', 'ADMIN', 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email_normalizado = 'admin.demo@cineastra.example' OR cpf_normalizado = '90000000001');

INSERT INTO usuarios (nome, email, senha, cpf, data_nascimento, tipo_usuario, status)
SELECT 'Ana Demonstração', 'ana.demo@cineastra.example', '$2b$12$utFR5JDWOq46BaxG9H03auCnjSkwx1QBQI2aIq9a28zjVpkqcYOCm', '90000000002', '1995-03-12', 'CLIENTE', 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email_normalizado = 'ana.demo@cineastra.example' OR cpf_normalizado = '90000000002');

INSERT INTO usuarios (nome, email, senha, cpf, data_nascimento, tipo_usuario, status)
SELECT 'Bruno Demonstração', 'bruno.demo@cineastra.example', '$2b$12$JFvTUT09SUVJI1qJS0WofuzquRWwGN06zuCIC6c89mqxlx2jId0pG', '90000000003', '1997-07-20', 'CLIENTE', 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email_normalizado = 'bruno.demo@cineastra.example' OR cpf_normalizado = '90000000003');

INSERT INTO usuarios (nome, email, senha, cpf, data_nascimento, tipo_usuario, status)
SELECT 'Carla Demonstração', 'carla.demo@cineastra.example', '$2b$12$xMhwlubyPLJecU41IMMhiuD6g3FkkApjD3cV49.tq365T2603UFfy', '90000000004', '2000-05-08', 'CLIENTE', 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email_normalizado = 'carla.demo@cineastra.example' OR cpf_normalizado = '90000000004');

INSERT INTO usuarios (nome, email, senha, cpf, data_nascimento, tipo_usuario, status)
SELECT 'Diego Demonstração', 'diego.demo@cineastra.example', '$2b$12$/aNQvdd6dzFZUMIYzojnCOI6LiOd9hwkQMOLCtY/5UC00B2GyWYl2', '90000000005', '1992-11-25', 'CLIENTE', 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email_normalizado = 'diego.demo@cineastra.example' OR cpf_normalizado = '90000000005');

-- FILMES: somente catálogo de cinema; não cria sessões, direitos ou reprodução streaming.
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, disponivel_cinema, disponivel_streaming, status)
SELECT 'Interestelar', 'Uma equipe viaja pelo espaço em busca de um novo lar para a humanidade.', 169, '10', '2014-11-06', 'Christopher Nolan', 'http://cineastra.10.189.87.231.sslip.io/images/cinema/interestelar.jpg', TRUE, FALSE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo = 'Interestelar');

INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, disponivel_cinema, disponivel_streaming, status)
SELECT 'Soul', 'Um professor de música descobre novos significados para a vida.', 100, 'L', '2020-12-25', 'Pete Docter', 'http://cineastra.10.189.87.231.sslip.io/images/cinema/soul.jpg', TRUE, FALSE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo = 'Soul');

INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, disponivel_cinema, disponivel_streaming, status)
SELECT 'A Viagem de Chihiro', 'Uma jovem precisa encontrar seu caminho em um mundo de espíritos.', 125, 'L', '2003-07-18', 'Hayao Miyazaki', 'http://cineastra.10.189.87.231.sslip.io/images/cinema/viagem-chihiro.jpg', TRUE, FALSE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo = 'A Viagem de Chihiro');

INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, disponivel_cinema, disponivel_streaming, status)
SELECT 'Whiplash', 'Um jovem baterista enfrenta os limites de sua ambição musical.', 107, '12', '2015-01-08', 'Damien Chazelle', 'http://cineastra.10.189.87.231.sslip.io/images/cinema/whiplash.jpg', TRUE, FALSE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo = 'Whiplash');

INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, disponivel_cinema, disponivel_streaming, status)
SELECT 'Meu Amigo Totoro', 'Duas irmãs descobrem criaturas mágicas perto de sua nova casa.', 86, 'L', '1995-03-24', 'Hayao Miyazaki', 'http://cineastra.10.189.87.231.sslip.io/images/cinema/meu-amigo-totoro.jpg', TRUE, FALSE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo = 'Meu Amigo Totoro');

COMMIT;
