-- BEGIN CINEASTRA_CATALOGO_100
-- 100 filmes reais: títulos e sinopses em português, cartazes e metadados do catálogo público.
-- Fonte dos metadados: https://github.com/CrawlFeeds/movies-datasets
-- Classificações indicativas representativas para apresentação; não são certificações oficiais.
-- Trailers do YouTube associados ao filme no TMDB e disponíveis na consulta de metadados. Não disponibiliza arquivos dos filmes.
SET NAMES utf8mb4;
START TRANSACTION;
INSERT INTO generos (nome, status) SELECT 'Ação', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Ação');
INSERT INTO generos (nome, status) SELECT 'Crime', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Crime');
INSERT INTO generos (nome, status) SELECT 'Suspense', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Suspense');
INSERT INTO generos (nome, status) SELECT 'Drama', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Drama');
INSERT INTO generos (nome, status) SELECT 'Comédia', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Comédia');
INSERT INTO generos (nome, status) SELECT 'Romance', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Romance');
INSERT INTO generos (nome, status) SELECT 'Aventura', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Aventura');
INSERT INTO generos (nome, status) SELECT 'Fantasia', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Fantasia');
INSERT INTO generos (nome, status) SELECT 'Ficção Científica', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Ficção Científica');
INSERT INTO generos (nome, status) SELECT 'Mistério', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Mistério');
INSERT INTO generos (nome, status) SELECT 'Animação', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Animação');
INSERT INTO generos (nome, status) SELECT 'Família', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Família');
INSERT INTO generos (nome, status) SELECT 'Terror', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Terror');
INSERT INTO generos (nome, status) SELECT 'História', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'História');
INSERT INTO generos (nome, status) SELECT 'Guerra', 'ATIVO' WHERE NOT EXISTS (SELECT 1 FROM generos WHERE nome = 'Guerra');

-- 1/100: The Dark Knight
-- Trailer: Batman - O Cavaleiro das Trevas :: Trailer Final (dublado) | Canal: Warner Bros. Pictures Brasil
-- Fonte: https://www.themoviedb.org/movie/155/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Batman: O Cavaleiro das Trevas', 'Batman enfrenta o Coringa, que transforma Gotham em palco de caos e dilemas.', 152, '12', '2008-07-16', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'https://www.youtube.com/watch?v=oFJ7Yry2p18', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Batman: O Cavaleiro das Trevas', 'The Dark Knight'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Crime', 'Suspense') WHERE f.titulo IN ('Batman: O Cavaleiro das Trevas', 'The Dark Knight') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=oFJ7Yry2p18' WHERE titulo IN ('Batman: O Cavaleiro das Trevas', 'The Dark Knight');

-- 2/100: Fight Club
-- Trailer: Fight Club | #TBT Trailer | 20th Century FOX | Canal: 20th Century Studios
-- Fonte: https://www.themoviedb.org/movie/550/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Clube da Luta', 'Um homem insatisfeito cria um clube de lutas com um vendedor enigmático.', 139, '18', '1999-10-15', 'David Fincher', 'https://image.tmdb.org/t/p/w500/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg', 'https://www.youtube.com/watch?v=BdJKm16Co6M', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Clube da Luta', 'Fight Club'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Suspense') WHERE f.titulo IN ('Clube da Luta', 'Fight Club') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=BdJKm16Co6M' WHERE titulo IN ('Clube da Luta', 'Fight Club');

-- 3/100: Pulp Fiction
-- Trailer: Pulp Fiction | Official Trailer (HD) - John Travolta, Uma Thurman, Samuel L. Jackson | MIRAMAX | Canal: Miramax
-- Fonte: https://www.themoviedb.org/movie/680/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Pulp Fiction: Tempo de Violência', 'Criminosos de Los Angeles se cruzam em histórias de violência e escolhas inesperadas.', 154, '18', '1994-09-10', 'Quentin Tarantino', 'https://image.tmdb.org/t/p/w500/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg', 'https://www.youtube.com/watch?v=tGpTpVyI_OQ', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Pulp Fiction: Tempo de Violência', 'Pulp Fiction'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Suspense', 'Crime', 'Comédia') WHERE f.titulo IN ('Pulp Fiction: Tempo de Violência', 'Pulp Fiction') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=tGpTpVyI_OQ' WHERE titulo IN ('Pulp Fiction: Tempo de Violência', 'Pulp Fiction');

-- 4/100: Forrest Gump
-- Trailer: FORREST GUMP | Official 25th Anniversary Trailer | Paramount Movies | Canal: Paramount Movies
-- Fonte: https://www.themoviedb.org/movie/13/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Forrest Gump: O Contador de Histórias', 'Um homem de coração generoso atravessa acontecimentos marcantes da história americana.', 142, '12', '1994-06-23', 'Robert Zemeckis', 'https://image.tmdb.org/t/p/w500/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg', 'https://www.youtube.com/watch?v=Mj9IA9tTfio', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Forrest Gump: O Contador de Histórias', 'Forrest Gump'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Comédia', 'Drama', 'Romance') WHERE f.titulo IN ('Forrest Gump: O Contador de Histórias', 'Forrest Gump') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=Mj9IA9tTfio' WHERE titulo IN ('Forrest Gump: O Contador de Histórias', 'Forrest Gump');

-- 5/100: Harry Potter and the Philosopher's Stone
-- Trailer: Harry Potter and the Philosopher's Stone | Official Trailer | Canal: Harry Potter
-- Fonte: https://www.themoviedb.org/movie/671/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Harry Potter e a Pedra Filosofal', 'Um menino descobre que é bruxo e começa seus estudos em Hogwarts.', 152, 'L', '2001-11-16', 'Chris Columbus', 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg', 'https://www.youtube.com/watch?v=l91Km49W9qI', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Harry Potter e a Pedra Filosofal', 'Harry Potter and the Philosopher\'s Stone'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia') WHERE f.titulo IN ('Harry Potter e a Pedra Filosofal', 'Harry Potter and the Philosopher\'s Stone') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=l91Km49W9qI' WHERE titulo IN ('Harry Potter e a Pedra Filosofal', 'Harry Potter and the Philosopher\'s Stone');

-- 6/100: Iron Man
-- Trailer: Homem de Ferro | Trailer Oficial Dublado (HD) | Canal: Marvel Geek 
-- Fonte: https://www.themoviedb.org/movie/1726/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Homem de Ferro', 'Após ser sequestrado, um inventor cria uma armadura e repensa seu legado.', 126, '12', '2008-04-30', 'Jon Favreau', 'https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg', 'https://www.youtube.com/watch?v=j_Ez4QVs_1g', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Homem de Ferro', 'Iron Man'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Ficção Científica', 'Aventura') WHERE f.titulo IN ('Homem de Ferro', 'Iron Man') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=j_Ez4QVs_1g' WHERE titulo IN ('Homem de Ferro', 'Iron Man');

-- 7/100: The Matrix
-- Trailer: The Matrix | 4K Trailer | Warner Bros. Entertainment | Canal: Warner Bros. Entertainment
-- Fonte: https://www.themoviedb.org/movie/603/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Matrix', 'Um programador descobre que a realidade esconde um sistema de controle.', 136, '14', '1999-03-31', 'Lana Wachowski, Lilly Wachowski', 'https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg', 'https://www.youtube.com/watch?v=nUEQNVV3Gfs', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Matrix', 'The Matrix'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Ficção Científica') WHERE f.titulo IN ('Matrix', 'The Matrix') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=nUEQNVV3Gfs' WHERE titulo IN ('Matrix', 'The Matrix');

-- 8/100: The Lord of the Rings: The Fellowship of the Ring
-- Trailer: O Senhor dos Anéis  A sociedade do Anel 2001 - Trailer (Legendado) | Canal: Velox Tickets
-- Fonte: https://www.themoviedb.org/movie/120/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Senhor dos Anéis: A Sociedade do Anel', 'Frodo inicia uma jornada para destruir um anel capaz de dominar a Terra-média.', 179, '12', '2001-12-18', 'Peter Jackson', 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 'https://www.youtube.com/watch?v=0i86oM1nHjM', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Senhor dos Anéis: A Sociedade do Anel', 'The Lord of the Rings: The Fellowship of the Ring'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia', 'Ação') WHERE f.titulo IN ('O Senhor dos Anéis: A Sociedade do Anel', 'The Lord of the Rings: The Fellowship of the Ring') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=0i86oM1nHjM' WHERE titulo IN ('O Senhor dos Anéis: A Sociedade do Anel', 'The Lord of the Rings: The Fellowship of the Ring');

-- 9/100: Titanic
-- Trailer: Titanic | Trailer Oficial Legendado | Canal: 20th Century Studios Brasil
-- Fonte: https://www.themoviedb.org/movie/597/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Titanic', 'Dois jovens de mundos diferentes se apaixonam durante a viagem do Titanic.', 194, '12', '1997-12-18', 'James Cameron', 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 'https://www.youtube.com/watch?v=IH6_CA_ocqY', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Titanic', 'Titanic'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Romance') WHERE f.titulo IN ('Titanic', 'Titanic') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=IH6_CA_ocqY' WHERE titulo IN ('Titanic', 'Titanic');

-- 10/100: The Lord of the Rings: The Return of the King
-- Trailer: Lord of the Rings: The Return of the King - Original Theatrical Trailer | Canal: Warner Bros. Rewind
-- Fonte: https://www.themoviedb.org/movie/122/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Senhor dos Anéis: O Retorno do Rei', 'A batalha pela Terra-média chega ao fim enquanto Frodo se aproxima de Mordor.', 201, '12', '2003-12-17', 'Peter Jackson', 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', 'https://www.youtube.com/watch?v=KOQSQaGgJxs', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Senhor dos Anéis: O Retorno do Rei', 'The Lord of the Rings: The Return of the King'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia', 'Ação') WHERE f.titulo IN ('O Senhor dos Anéis: O Retorno do Rei', 'The Lord of the Rings: The Return of the King') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=KOQSQaGgJxs' WHERE titulo IN ('O Senhor dos Anéis: O Retorno do Rei', 'The Lord of the Rings: The Return of the King');

-- 11/100: The Lord of the Rings: The Two Towers
-- Trailer: Lord of the Rings: The Two Towers - Original Theatrical Trailer | Canal: Warner Bros. Rewind
-- Fonte: https://www.themoviedb.org/movie/121/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Senhor dos Anéis: As Duas Torres', 'A sociedade se divide enquanto seus integrantes enfrentam novas ameaças.', 179, '12', '2002-12-18', 'Peter Jackson', 'https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg', 'https://www.youtube.com/watch?v=Y4neBR0h39c', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Senhor dos Anéis: As Duas Torres', 'The Lord of the Rings: The Two Towers'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia', 'Ação') WHERE f.titulo IN ('O Senhor dos Anéis: As Duas Torres', 'The Lord of the Rings: The Two Towers') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=Y4neBR0h39c' WHERE titulo IN ('O Senhor dos Anéis: As Duas Torres', 'The Lord of the Rings: The Two Towers');

-- 12/100: Harry Potter and the Chamber of Secrets
-- Trailer: Harry Potter and the Chamber of Secrets | Official Trailer | Canal: Harry Potter
-- Fonte: https://www.themoviedb.org/movie/672/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Harry Potter e a Câmara Secreta', 'Harry investiga ataques misteriosos durante seu segundo ano em Hogwarts.', 161, 'L', '2002-11-13', 'Chris Columbus', 'https://image.tmdb.org/t/p/w500/sdEOH0992YZ0QSxgXNIGLq1ToUi.jpg', 'https://www.youtube.com/watch?v=nE11U5iBnH0', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Harry Potter e a Câmara Secreta', 'Harry Potter and the Chamber of Secrets'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia') WHERE f.titulo IN ('Harry Potter e a Câmara Secreta', 'Harry Potter and the Chamber of Secrets') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=nE11U5iBnH0' WHERE titulo IN ('Harry Potter e a Câmara Secreta', 'Harry Potter and the Chamber of Secrets');

-- 13/100: Harry Potter and the Prisoner of Azkaban
-- Trailer: Harry Potter and the Prisoner of Azkaban - Trailer | Canal: YouTube Movies
-- Fonte: https://www.themoviedb.org/movie/673/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Harry Potter e o Prisioneiro de Azkaban', 'A fuga de um prisioneiro revela segredos ligados ao passado de Harry.', 141, 'L', '2004-05-31', 'Alfonso Cuarón', 'https://image.tmdb.org/t/p/w500/aWxwnYoe8p2d2fcxOqtvAtJ72Rw.jpg', 'https://www.youtube.com/watch?v=R69laoH02xg', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Harry Potter e o Prisioneiro de Azkaban', 'Harry Potter and the Prisoner of Azkaban'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia') WHERE f.titulo IN ('Harry Potter e o Prisioneiro de Azkaban', 'Harry Potter and the Prisoner of Azkaban') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=R69laoH02xg' WHERE titulo IN ('Harry Potter e o Prisioneiro de Azkaban', 'Harry Potter and the Prisoner of Azkaban');

-- 14/100: Se7en
-- Trailer: Seven | Official Trailer 4K Ultra HD | Warner Bros. Entertainment | Canal: Warner Bros. Entertainment
-- Fonte: https://www.themoviedb.org/movie/807/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Seven: Os Sete Crimes Capitais', 'Dois detetives perseguem um assassino que organiza seus crimes pelos pecados capitais.', 127, '18', '1995-09-22', 'David Fincher', 'https://image.tmdb.org/t/p/w500/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg', 'https://www.youtube.com/watch?v=KPOuJGkpblk', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Seven: Os Sete Crimes Capitais', 'Se7en'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Crime', 'Mistério', 'Suspense') WHERE f.titulo IN ('Seven: Os Sete Crimes Capitais', 'Se7en') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=KPOuJGkpblk' WHERE titulo IN ('Seven: Os Sete Crimes Capitais', 'Se7en');

-- 15/100: The Godfather
-- Trailer: O Poderoso Chefão | Aniversário de 50 Anos | Trailer Oficial | Paramount Pictures Brasil | Canal: Paramount Brasil
-- Fonte: https://www.themoviedb.org/movie/238/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Poderoso Chefão', 'A família Corleone enfrenta mudanças de poder no mundo do crime organizado.', 175, '14', '1972-03-14', 'Francis Ford Coppola', 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 'https://www.youtube.com/watch?v=0v6MO0EB7UY', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Poderoso Chefão', 'The Godfather'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Crime') WHERE f.titulo IN ('O Poderoso Chefão', 'The Godfather') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=0v6MO0EB7UY' WHERE titulo IN ('O Poderoso Chefão', 'The Godfather');

-- 16/100: Captain America: The First Avenger
-- Trailer: Captain America: The First Avenger - Trailer | Canal: Marvel Entertainment
-- Fonte: https://www.themoviedb.org/movie/1771/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Capitão América: O Primeiro Vingador', 'Steve Rogers participa de um experimento e se torna um símbolo de resistência.', 124, '12', '2011-07-22', 'Joe Johnston', 'https://image.tmdb.org/t/p/w500/vSNxAJTlD0r02V9sPYpOjqDZXUK.jpg', 'https://www.youtube.com/watch?v=JerVrbLldXw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Capitão América: O Primeiro Vingador', 'Captain America: The First Avenger'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Aventura', 'Ficção Científica') WHERE f.titulo IN ('Capitão América: O Primeiro Vingador', 'Captain America: The First Avenger') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=JerVrbLldXw' WHERE titulo IN ('Capitão América: O Primeiro Vingador', 'Captain America: The First Avenger');

-- 17/100: Star Wars
-- Trailer: Star Wars Episode IV: A New Hope - Trailer | Canal: Star Wars
-- Fonte: https://www.themoviedb.org/movie/11/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Star Wars: Uma Nova Esperança', 'Luke Skywalker se une a uma rebelião contra o Império Galáctico.', 121, 'L', '1977-05-25', 'George Lucas', 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg', 'https://www.youtube.com/watch?v=vZ734NWnAHA', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Star Wars: Uma Nova Esperança', 'Star Wars'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Ação', 'Ficção Científica') WHERE f.titulo IN ('Star Wars: Uma Nova Esperança', 'Star Wars') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=vZ734NWnAHA' WHERE titulo IN ('Star Wars: Uma Nova Esperança', 'Star Wars');

-- 18/100: Pirates of the Caribbean: The Curse of the Black Pearl
-- Trailer: Piratas do Caribe - A Maldição do Pérola Negra Trailer Dublado Português 720p | Canal: yoshimitsumovies
-- Fonte: https://www.themoviedb.org/movie/22/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Piratas do Caribe: A Maldição do Pérola Negra', 'Um ferreiro se alia a Jack Sparrow para enfrentar uma tripulação amaldiçoada.', 143, '12', '2003-07-09', 'Gore Verbinski', 'https://image.tmdb.org/t/p/w500/poHwCZeWzJCShH7tOjg8RIoyjcw.jpg', 'https://www.youtube.com/watch?v=DGnatLS9Ohw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Piratas do Caribe: A Maldição do Pérola Negra', 'Pirates of the Caribbean: The Curse of the Black Pearl'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia', 'Ação') WHERE f.titulo IN ('Piratas do Caribe: A Maldição do Pérola Negra', 'Pirates of the Caribbean: The Curse of the Black Pearl') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=DGnatLS9Ohw' WHERE titulo IN ('Piratas do Caribe: A Maldição do Pérola Negra', 'Pirates of the Caribbean: The Curse of the Black Pearl');

-- 19/100: Harry Potter and the Goblet of Fire
-- Trailer: Harry Potter and the Goblet of Fire - Trailer | Canal: Warner On Demand
-- Fonte: https://www.themoviedb.org/movie/674/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Harry Potter e o Cálice de Fogo', 'Harry é escolhido para um torneio perigoso entre escolas de magia.', 157, '12', '2005-11-16', 'Mike Newell', 'https://image.tmdb.org/t/p/w500/fECBtHlr0RB3foNHDiCBXeg9Bv9.jpg', 'https://www.youtube.com/watch?v=PFWAOnvMd1Q', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Harry Potter e o Cálice de Fogo', 'Harry Potter and the Goblet of Fire'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia') WHERE f.titulo IN ('Harry Potter e o Cálice de Fogo', 'Harry Potter and the Goblet of Fire') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=PFWAOnvMd1Q' WHERE titulo IN ('Harry Potter e o Cálice de Fogo', 'Harry Potter and the Goblet of Fire');

-- 20/100: Back to the Future
-- Trailer: Back to the Future | Official Rerelease Trailer | Park Circus | Canal: Park Circus
-- Fonte: https://www.themoviedb.org/movie/105/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'De Volta para o Futuro', 'Um adolescente viaja ao passado e precisa garantir o encontro dos próprios pais.', 116, 'L', '1985-07-03', 'Robert Zemeckis', 'https://image.tmdb.org/t/p/w500/vN5B5WgYscRGcQpVhHl6p9DDTP0.jpg', 'https://www.youtube.com/watch?v=C-4Pr9kBtGc', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('De Volta para o Futuro', 'Back to the Future'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Comédia', 'Ficção Científica') WHERE f.titulo IN ('De Volta para o Futuro', 'Back to the Future') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=C-4Pr9kBtGc' WHERE titulo IN ('De Volta para o Futuro', 'Back to the Future');

-- 21/100: Gladiator
-- Trailer: GLADIATOR | Official Trailer | Paramount Movies | Canal: Paramount Movies
-- Fonte: https://www.themoviedb.org/movie/98/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Gladiador', 'Um general traído busca justiça como gladiador na Roma antiga.', 155, '16', '2000-05-04', 'Ridley Scott', 'https://image.tmdb.org/t/p/w500/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg', 'https://www.youtube.com/watch?v=P5ieIbInFpg', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Gladiador', 'Gladiator'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Drama', 'Aventura') WHERE f.titulo IN ('Gladiador', 'Gladiator') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=P5ieIbInFpg' WHERE titulo IN ('Gladiador', 'Gladiator');

-- 22/100: Harry Potter and the Order of the Phoenix
-- Trailer: Harry Potter and the Order of the Phoenix - Original 2007 Theatrical Trailer | Canal: Warner Bros. Rewind
-- Fonte: https://www.themoviedb.org/movie/675/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Harry Potter e a Ordem da Fênix', 'Harry reúne seus colegas para enfrentar a crescente ameaça de Voldemort.', 138, '12', '2007-07-08', 'David Yates', 'https://image.tmdb.org/t/p/w500/5aOyriWkPec0zUDxmHFP9qMmBaj.jpg', 'https://www.youtube.com/watch?v=WIj9DYJ5EKk', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Harry Potter e a Ordem da Fênix', 'Harry Potter and the Order of the Phoenix'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia') WHERE f.titulo IN ('Harry Potter e a Ordem da Fênix', 'Harry Potter and the Order of the Phoenix') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=WIj9DYJ5EKk' WHERE titulo IN ('Harry Potter e a Ordem da Fênix', 'Harry Potter and the Order of the Phoenix');

-- 23/100: Harry Potter and the Half-Blood Prince
-- Trailer: Harry Potter e o Enigma do Príncipe - Trailer Final (dublado) | Canal: Warner Bros. Pictures Brasil
-- Fonte: https://www.themoviedb.org/movie/767/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Harry Potter e o Enigma do Príncipe', 'Segredos do passado ajudam Harry a compreender seu maior inimigo.', 153, '12', '2009-07-15', 'David Yates', 'https://image.tmdb.org/t/p/w500/z7uo9zmQdQwU5ZJHFpv2Upl30i1.jpg', 'https://www.youtube.com/watch?v=xqfiYZ6ohnQ', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Harry Potter e o Enigma do Príncipe', 'Harry Potter and the Half-Blood Prince'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia') WHERE f.titulo IN ('Harry Potter e o Enigma do Príncipe', 'Harry Potter and the Half-Blood Prince') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=xqfiYZ6ohnQ' WHERE titulo IN ('Harry Potter e o Enigma do Príncipe', 'Harry Potter and the Half-Blood Prince');

-- 24/100: Spider-Man
-- Trailer: Official Trailer (HD) | Spider-Man 2002 | Canal: Spider-Man
-- Fonte: https://www.themoviedb.org/movie/557/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Homem-Aranha', 'Peter Parker aprende a equilibrar sua vida com a responsabilidade de ser um herói.', 121, '12', '2002-05-01', 'Sam Raimi', 'https://image.tmdb.org/t/p/w500/nXdAh5vUwERL4WGVMaee8RoDEAS.jpg', 'https://www.youtube.com/watch?v=nwyO5Ue6JUQ', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Homem-Aranha', 'Spider-Man'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Ficção Científica') WHERE f.titulo IN ('Homem-Aranha', 'Spider-Man') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=nwyO5Ue6JUQ' WHERE titulo IN ('Homem-Aranha', 'Spider-Man');

-- 25/100: Finding Nemo
-- Trailer: Procurando Nemo 3D: Trailer Oficial - Disney Pixar | Canal: Walt Disney Studios BR
-- Fonte: https://www.themoviedb.org/movie/12/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Procurando Nemo', 'Um peixe atravessa o oceano com uma companheira esquecida para encontrar seu filho.', 100, 'L', '2003-05-30', 'Andrew Stanton', 'https://image.tmdb.org/t/p/w500/5lc6nQc0VhWFYFbNv016xze8Jvy.jpg', 'https://www.youtube.com/watch?v=lJhvtAt_1Nk', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Procurando Nemo', 'Finding Nemo'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Família', 'Aventura') WHERE f.titulo IN ('Procurando Nemo', 'Finding Nemo') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=lJhvtAt_1Nk' WHERE titulo IN ('Procurando Nemo', 'Finding Nemo');

-- 26/100: Toy Story
-- Trailer: Toy Story | Original Trailer | Disney+ | Canal: Disney Plus
-- Fonte: https://www.themoviedb.org/movie/862/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Toy Story', 'Dois brinquedos rivais precisam cooperar para voltar ao seu dono.', 81, 'L', '1995-11-22', 'John Lasseter', 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg', 'https://www.youtube.com/watch?v=CxwTLktovTU', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Toy Story', 'Toy Story'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Família', 'Comédia', 'Animação', 'Aventura') WHERE f.titulo IN ('Toy Story', 'Toy Story') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=CxwTLktovTU' WHERE titulo IN ('Toy Story', 'Toy Story');

-- 27/100: Monsters, Inc.
-- Trailer: Monstros S.A. 3D: Trailer Oficial | Canal: Walt Disney Studios BR
-- Fonte: https://www.themoviedb.org/movie/585/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Monstros S.A.', 'Dois monstros descobrem que uma criança pode mudar o funcionamento de sua cidade.', 92, 'L', '2001-11-01', 'Pete Docter', 'https://image.tmdb.org/t/p/w500/wFSpyMsp7H0ttERbxY7Trlv8xry.jpg', 'https://www.youtube.com/watch?v=iRh2kF-1X2E', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Monstros S.A.', 'Monsters, Inc.'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Comédia', 'Família', 'Fantasia') WHERE f.titulo IN ('Monstros S.A.', 'Monsters, Inc.') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=iRh2kF-1X2E' WHERE titulo IN ('Monstros S.A.', 'Monsters, Inc.');

-- 28/100: The Green Mile
-- Trailer: The Green Mile | 4K Trailer | Warner Bros. Entertainment | Canal: Warner Bros. Entertainment
-- Fonte: https://www.themoviedb.org/movie/497/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'À Espera de um Milagre', 'Um agente penitenciário conhece um condenado com um dom extraordinário.', 189, '16', '1999-12-10', 'Frank Darabont', 'https://image.tmdb.org/t/p/w500/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg', 'https://www.youtube.com/watch?v=Bg7epsq0OIQ', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('À Espera de um Milagre', 'The Green Mile'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Fantasia', 'Drama', 'Crime') WHERE f.titulo IN ('À Espera de um Milagre', 'The Green Mile') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=Bg7epsq0OIQ' WHERE titulo IN ('À Espera de um Milagre', 'The Green Mile');

-- 29/100: Kill Bill: Vol. 1
-- Trailer: Kill Bill Volume 1 (2003) Theatrical Trailer [5.1] [4K] [FTD-1288] | Canal: FT Depot
-- Fonte: https://www.themoviedb.org/movie/24/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Kill Bill: Volume 1', 'Uma mulher desperta do coma e inicia uma jornada de vingança.', 111, '18', '2003-10-10', 'Quentin Tarantino', 'https://image.tmdb.org/t/p/w500/v7TaX8kXMXs5yFFGR41guUDNcnB.jpg', 'https://www.youtube.com/watch?v=sXwXk3jcrfU', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Kill Bill: Volume 1', 'Kill Bill: Vol. 1'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Crime') WHERE f.titulo IN ('Kill Bill: Volume 1', 'Kill Bill: Vol. 1') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=sXwXk3jcrfU' WHERE titulo IN ('Kill Bill: Volume 1', 'Kill Bill: Vol. 1');

-- 30/100: The Shining
-- Trailer: The Shining - Official Trailer [1980] HD | Canal: Stanley Kubrick
-- Fonte: https://www.themoviedb.org/movie/694/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Iluminado', 'Uma família passa o inverno isolada em um hotel marcado por forças sombrias.', 144, '16', '1980-05-23', 'Stanley Kubrick', 'https://image.tmdb.org/t/p/w500/uAR0AWqhQL1hQa69UDEbb2rE5Wx.jpg', 'https://www.youtube.com/watch?v=S014oGZiSdI', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Iluminado', 'The Shining'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Terror', 'Suspense') WHERE f.titulo IN ('O Iluminado', 'The Shining') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=S014oGZiSdI' WHERE titulo IN ('O Iluminado', 'The Shining');

-- 31/100: Shrek
-- Trailer: Shrek | 25th Anniversary Trailer | Canal: Universal Pictures
-- Fonte: https://www.themoviedb.org/movie/808/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Shrek', 'Um ogro parte em uma missão para recuperar a tranquilidade de seu pântano.', 90, 'L', '2001-05-18', 'Andrew Adamson, Vicky Jenson', 'https://image.tmdb.org/t/p/w500/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg', 'https://www.youtube.com/watch?v=ppDwfm6e498', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Shrek', 'Shrek'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Comédia', 'Fantasia', 'Aventura', 'Família') WHERE f.titulo IN ('Shrek', 'Shrek') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=ppDwfm6e498' WHERE titulo IN ('Shrek', 'Shrek');

-- 32/100: Spirited Away
-- Trailer: Spirited Away - Official Trailer | Canal: Crunchyroll Store Australia
-- Fonte: https://www.themoviedb.org/movie/129/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'A Viagem de Chihiro', 'Uma menina entra em um mundo de espíritos e tenta salvar seus pais.', 125, 'L', '2001-07-20', 'Hayao Miyazaki', 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', 'https://www.youtube.com/watch?v=ByXuk9QqQkk', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('A Viagem de Chihiro', 'Spirited Away'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Família', 'Fantasia') WHERE f.titulo IN ('A Viagem de Chihiro', 'Spirited Away') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=ByXuk9QqQkk' WHERE titulo IN ('A Viagem de Chihiro', 'Spirited Away');

-- 33/100: Jurassic Park
-- Trailer: Jurassic Park 3D - Trailer | Canal: Universal Pictures Brasil
-- Fonte: https://www.themoviedb.org/movie/329/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Jurassic Park: O Parque dos Dinossauros', 'Uma visita a um parque de dinossauros se transforma em uma luta pela sobrevivência.', 127, 'L', '1993-06-11', 'Steven Spielberg', 'https://image.tmdb.org/t/p/w500/b1xCNnyrPebIc7EWNZIa6jhb1Ww.jpg', 'https://www.youtube.com/watch?v=YizU376o3tQ', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Jurassic Park: O Parque dos Dinossauros', 'Jurassic Park'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Ficção Científica') WHERE f.titulo IN ('Jurassic Park: O Parque dos Dinossauros', 'Jurassic Park') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=YizU376o3tQ' WHERE titulo IN ('Jurassic Park: O Parque dos Dinossauros', 'Jurassic Park');

-- 34/100: The Prestige
-- Trailer: The Prestige - Trailer | Canal: YouTube Movies
-- Fonte: https://www.themoviedb.org/movie/1124/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Grande Truque', 'Dois mágicos transformam sua rivalidade em uma obsessão cada vez mais perigosa.', 130, '14', '2006-10-19', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w500/Ag2B2KHKQPukjH7WutmgnnSNurZ.jpg', 'https://www.youtube.com/watch?v=ijXruSzfGEc', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Grande Truque', 'The Prestige'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Mistério', 'Ficção Científica') WHERE f.titulo IN ('O Grande Truque', 'The Prestige') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=ijXruSzfGEc' WHERE titulo IN ('O Grande Truque', 'The Prestige');

-- 35/100: Schindler's List
-- Trailer: A Lista de Schindler (25º Aniversário) - Trailer Oficial (Universal Pictures) HD | Canal: Universal Pictures Brasil
-- Fonte: https://www.themoviedb.org/movie/424/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'A Lista de Schindler', 'Um industrial tenta proteger trabalhadores judeus durante o Holocausto.', 195, '14', '1993-12-15', 'Steven Spielberg', 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', 'https://www.youtube.com/watch?v=RQfPCRUz6lw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('A Lista de Schindler', 'Schindler\'s List'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'História', 'Guerra') WHERE f.titulo IN ('A Lista de Schindler', 'Schindler\'s List') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=RQfPCRUz6lw' WHERE titulo IN ('A Lista de Schindler', 'Schindler\'s List');

-- 36/100: Saving Private Ryan
-- Trailer: Saving Private Ryan - Trailer | Canal: YouTube Movies
-- Fonte: https://www.themoviedb.org/movie/857/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Resgate do Soldado Ryan', 'Uma equipe atravessa os campos de batalha para encontrar um soldado desaparecido.', 169, '14', '1998-07-24', 'Steven Spielberg', 'https://image.tmdb.org/t/p/w500/uqx37cS8cpHg8U35f9U5IBlrCV3.jpg', 'https://www.youtube.com/watch?v=RYExstiQlLc', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Resgate do Soldado Ryan', 'Saving Private Ryan'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Guerra', 'Drama', 'História') WHERE f.titulo IN ('O Resgate do Soldado Ryan', 'Saving Private Ryan') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=RYExstiQlLc' WHERE titulo IN ('O Resgate do Soldado Ryan', 'Saving Private Ryan');

-- 37/100: Pirates of the Caribbean: Dead Man's Chest
-- Trailer: Pirates of the Caribbean Dead Man's Chest Trailer HD | Canal: Goran Mrdalj
-- Fonte: https://www.themoviedb.org/movie/58/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Piratas do Caribe: O Baú da Morte', 'Jack Sparrow precisa enfrentar uma dívida antiga com o temido Davy Jones.', 151, '12', '2006-07-06', 'Gore Verbinski', 'https://image.tmdb.org/t/p/w500/uXEqmloGyP7UXAiphJUu2v2pcuE.jpg', 'https://www.youtube.com/watch?v=9SFWn9taQTw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Piratas do Caribe: O Baú da Morte', 'Pirates of the Caribbean: Dead Man\'s Chest'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Fantasia', 'Ação') WHERE f.titulo IN ('Piratas do Caribe: O Baú da Morte', 'Pirates of the Caribbean: Dead Man\'s Chest') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=9SFWn9taQTw' WHERE titulo IN ('Piratas do Caribe: O Baú da Morte', 'Pirates of the Caribbean: Dead Man\'s Chest');

-- 38/100: Catch Me If You Can
-- Trailer: Catch Me If You Can - Trailer | Canal: Paramount Movies
-- Fonte: https://www.themoviedb.org/movie/640/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Prenda-me Se For Capaz', 'Um jovem falsificador desafia as autoridades enquanto um agente tenta capturá-lo.', 141, '12', '2002-12-16', 'Steven Spielberg', 'https://image.tmdb.org/t/p/w500/ctjEj2xM32OvBXCq8zAdK3ZrsAj.jpg', 'https://www.youtube.com/watch?v=71rDQ7z4eFg', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Prenda-me Se For Capaz', 'Catch Me If You Can'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Crime') WHERE f.titulo IN ('Prenda-me Se For Capaz', 'Catch Me If You Can') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=71rDQ7z4eFg' WHERE titulo IN ('Prenda-me Se For Capaz', 'Catch Me If You Can');

-- 39/100: Alien
-- Trailer: Alien | #TBT Trailer | 20th Century FOX | Canal: Alien Anthology
-- Fonte: https://www.themoviedb.org/movie/348/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Alien: O Oitavo Passageiro', 'A tripulação de uma nave encontra uma forma de vida mortal no espaço.', 117, '14', '1979-05-25', 'Ridley Scott', 'https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg', 'https://www.youtube.com/watch?v=L2VWfWC-wI4', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Alien: O Oitavo Passageiro', 'Alien'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Terror', 'Ficção Científica') WHERE f.titulo IN ('Alien: O Oitavo Passageiro', 'Alien') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=L2VWfWC-wI4' WHERE titulo IN ('Alien: O Oitavo Passageiro', 'Alien');

-- 40/100: Spider-Man 2
-- Trailer: Spider-man 2 (2004) - Trailer | Canal: Sony Pics at Home
-- Fonte: https://www.themoviedb.org/movie/558/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Homem-Aranha 2', 'Peter Parker enfrenta o Doutor Octopus enquanto questiona sua vida como herói.', 127, 'L', '2004-06-25', 'Sam Raimi', 'https://image.tmdb.org/t/p/w500/aGuvNAaaZuWXYQQ6N2v7DeuP6mB.jpg', 'https://www.youtube.com/watch?v=3jBFwltrxJw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Homem-Aranha 2', 'Spider-Man 2'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Aventura', 'Ficção Científica') WHERE f.titulo IN ('Homem-Aranha 2', 'Spider-Man 2') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=3jBFwltrxJw' WHERE titulo IN ('Homem-Aranha 2', 'Spider-Man 2');

-- 41/100: Eternal Sunshine of the Spotless Mind
-- Trailer: Eternal Sunshine of the Spotless Mind Original Trailer Uncut (35mm Scan 4K) | Canal: Kyle's Archive
-- Fonte: https://www.themoviedb.org/movie/38/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Brilho Eterno de uma Mente sem Lembranças', 'Um casal tenta apagar as memórias de um relacionamento que terminou.', 108, '14', '2004-03-19', 'Michel Gondry', 'https://image.tmdb.org/t/p/w500/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg', 'https://www.youtube.com/watch?v=c2e-bj6qy8Y', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Brilho Eterno de uma Mente sem Lembranças', 'Eternal Sunshine of the Spotless Mind'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ficção Científica', 'Drama', 'Romance') WHERE f.titulo IN ('Brilho Eterno de uma Mente sem Lembranças', 'Eternal Sunshine of the Spotless Mind') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=c2e-bj6qy8Y' WHERE titulo IN ('Brilho Eterno de uma Mente sem Lembranças', 'Eternal Sunshine of the Spotless Mind');

-- 42/100: Memento
-- Trailer: Memento | Official Restoration Trailer [4K] | Canal: Umbrella Entertainment
-- Fonte: https://www.themoviedb.org/movie/77/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Amnésia', 'Um homem com perda de memória recente busca pistas sobre um crime.', 113, '16', '2000-10-11', 'Christopher Nolan', 'https://image.tmdb.org/t/p/w500/nzlv62aC0octS5AklAiWpXLX9Z0.jpg', 'https://www.youtube.com/watch?v=Wyc9TpJxf4A', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Amnésia', 'Memento'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Mistério', 'Suspense') WHERE f.titulo IN ('Amnésia', 'Memento') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=Wyc9TpJxf4A' WHERE titulo IN ('Amnésia', 'Memento');

-- 43/100: The Departed
-- Trailer: The Departed | 4K Ultra HD Official Trailer | Warner Bros. Entertainment | Canal: Warner Bros. Entertainment
-- Fonte: https://www.themoviedb.org/movie/1422/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Os Infiltrados', 'Um policial e um criminoso infiltrados tentam descobrir a identidade um do outro.', 151, '16', '2006-10-04', 'Martin Scorsese', 'https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20Qblg61T.jpg', 'https://www.youtube.com/watch?v=r-MiSNsCdQ4', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Os Infiltrados', 'The Departed'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Suspense', 'Crime') WHERE f.titulo IN ('Os Infiltrados', 'The Departed') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=r-MiSNsCdQ4' WHERE titulo IN ('Os Infiltrados', 'The Departed');

-- 44/100: Léon: The Professional
-- Trailer: Leon: The Professional - Official Trailer | Canal: Madman Films
-- Fonte: https://www.themoviedb.org/movie/101/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Profissional', 'Uma jovem encontra proteção com um assassino profissional e busca justiça.', 111, '14', '1994-09-14', 'Luc Besson', 'https://image.tmdb.org/t/p/w500/bxB2q91nKYp8JNzqE7t7TWBVupB.jpg', 'https://www.youtube.com/watch?v=Nq101UyQyTo', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Profissional', 'Léon: The Professional'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Crime', 'Drama', 'Ação') WHERE f.titulo IN ('O Profissional', 'Léon: The Professional') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=Nq101UyQyTo' WHERE titulo IN ('O Profissional', 'Léon: The Professional');

-- 45/100: Charlie and the Chocolate Factory
-- Trailer: Charlie and the Chocolate Factory Trailer | Canal: Warner Bros. Rewind
-- Fonte: https://www.themoviedb.org/movie/118/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'A Fantástica Fábrica de Chocolate', 'Um menino visita uma fábrica misteriosa comandada pelo excêntrico Willy Wonka.', 115, 'L', '2005-07-13', 'Tim Burton', 'https://image.tmdb.org/t/p/w500/iKP6wg3c6COUe8gYutoGG7qcPnO.jpg', 'https://www.youtube.com/watch?v=p6JAQ2aoXm0', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('A Fantástica Fábrica de Chocolate', 'Charlie and the Chocolate Factory'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Comédia', 'Família', 'Fantasia') WHERE f.titulo IN ('A Fantástica Fábrica de Chocolate', 'Charlie and the Chocolate Factory') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=p6JAQ2aoXm0' WHERE titulo IN ('A Fantástica Fábrica de Chocolate', 'Charlie and the Chocolate Factory');

-- 46/100: V for Vendetta
-- Trailer: V For Vendetta (Trailer) | Canal: DC
-- Fonte: https://www.themoviedb.org/movie/752/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'V de Vingança', 'Um homem mascarado inspira resistência contra um governo autoritário.', 132, '16', '2006-02-23', 'James McTeigue', 'https://image.tmdb.org/t/p/w500/1avD1JeaRiJX5M4ahPdZPypGoGN.jpg', 'https://www.youtube.com/watch?v=IHVzzxrPt1c', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('V de Vingança', 'V for Vendetta'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Suspense', 'Ficção Científica') WHERE f.titulo IN ('V de Vingança', 'V for Vendetta') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=IHVzzxrPt1c' WHERE titulo IN ('V de Vingança', 'V for Vendetta');

-- 47/100: Reservoir Dogs
-- Trailer: Reservoir Dogs official trailer HD | Canal: Park Circus
-- Fonte: https://www.themoviedb.org/movie/500/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Cães de Aluguel', 'Após um assalto fracassado, criminosos desconfiam de um traidor no grupo.', 99, '18', '1992-09-02', 'Quentin Tarantino', 'https://image.tmdb.org/t/p/w500/xi8Iu6qyTfyZVDVy60raIOYJJmk.jpg', 'https://www.youtube.com/watch?v=2KLZ4fSXtgI', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Cães de Aluguel', 'Reservoir Dogs'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Crime', 'Suspense') WHERE f.titulo IN ('Cães de Aluguel', 'Reservoir Dogs') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=2KLZ4fSXtgI' WHERE titulo IN ('Cães de Aluguel', 'Reservoir Dogs');

-- 48/100: Spider-Man 3
-- Trailer: Spider-man 3 (2007) - Trailer | Canal: Sony Pics at Home
-- Fonte: https://www.themoviedb.org/movie/559/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Homem-Aranha 3', 'Novos inimigos e uma força sombria desafiam o equilíbrio de Peter Parker.', 139, '12', '2007-05-01', 'Sam Raimi', 'https://image.tmdb.org/t/p/w500/qFmwhVUoUSXjkKRmca5yGDEXBIj.jpg', 'https://www.youtube.com/watch?v=wPosLpgMtTY', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Homem-Aranha 3', 'Spider-Man 3'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Aventura', 'Ficção Científica') WHERE f.titulo IN ('Homem-Aranha 3', 'Spider-Man 3') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=wPosLpgMtTY' WHERE titulo IN ('Homem-Aranha 3', 'Spider-Man 3');

-- 49/100: Cars
-- Trailer: Cars (2006) Theatrical Trailer #1 [4K] [5.1] [FTD-0683] | Canal: FT Depot
-- Fonte: https://www.themoviedb.org/movie/920/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Carros', 'Um carro de corrida descobre o valor da amizade em uma pequena cidade.', 117, 'L', '2006-06-08', 'John Lasseter', 'https://image.tmdb.org/t/p/w500/2Touk3m5gzsqr1VsvxypdyHY5ci.jpg', 'https://www.youtube.com/watch?v=dMaU2ixutGg', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Carros', 'Cars'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Aventura', 'Comédia', 'Família') WHERE f.titulo IN ('Carros', 'Cars') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=dMaU2ixutGg' WHERE titulo IN ('Carros', 'Cars');

-- 50/100: Kill Bill: Vol. 2
-- Trailer: Kill Bill: Vol. 2 Official Trailer #1 - (2004) HD | Canal: Movieclips
-- Fonte: https://www.themoviedb.org/movie/393/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Kill Bill: Volume 2', 'A jornada de vingança da Noiva se aproxima de seu confronto decisivo.', 136, '16', '2004-04-16', 'Quentin Tarantino', 'https://image.tmdb.org/t/p/w500/2yhg0mZQMhDyvUQ4rG1IZ4oIA8L.jpg', 'https://www.youtube.com/watch?v=q2h6EFk36kI', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Kill Bill: Volume 2', 'Kill Bill: Vol. 2'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Crime', 'Suspense') WHERE f.titulo IN ('Kill Bill: Volume 2', 'Kill Bill: Vol. 2') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=q2h6EFk36kI' WHERE titulo IN ('Kill Bill: Volume 2', 'Kill Bill: Vol. 2');

-- 51/100: Blade Runner
-- Trailer: Blade Runner | 30th Anniversary Trailer | Warner Bros. Entertainment | Canal: Warner Bros. Entertainment
-- Fonte: https://www.themoviedb.org/movie/78/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Blade Runner: O Caçador de Androides', 'Um investigador persegue seres artificiais e questiona o significado da humanidade.', 118, '14', '1982-06-25', 'Ridley Scott', 'https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg', 'https://www.youtube.com/watch?v=iYhJ7Mf2Oxs', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Blade Runner: O Caçador de Androides', 'Blade Runner'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ficção Científica', 'Drama', 'Suspense') WHERE f.titulo IN ('Blade Runner: O Caçador de Androides', 'Blade Runner') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=iYhJ7Mf2Oxs' WHERE titulo IN ('Blade Runner: O Caçador de Androides', 'Blade Runner');

-- 52/100: Toy Story 2
-- Trailer: Toy Story 2 (1999) Trailer #1 | Movieclips Classic Trailers | Canal: Rotten Tomatoes Classic Trailers
-- Fonte: https://www.themoviedb.org/movie/863/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Toy Story 2', 'Os brinquedos organizam um resgate quando Woody é levado por um colecionador.', 92, 'L', '1999-10-30', 'John Lasseter', 'https://image.tmdb.org/t/p/w500/4rbcp3ng8n1MKHjpeqW0L7Fnpzz.jpg', 'https://www.youtube.com/watch?v=xNWSGRD5CzU', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Toy Story 2', 'Toy Story 2'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Comédia', 'Família') WHERE f.titulo IN ('Toy Story 2', 'Toy Story 2') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=xNWSGRD5CzU' WHERE titulo IN ('Toy Story 2', 'Toy Story 2');

-- 53/100: Men in Black
-- Trailer: Men In Black (1997) - Trailer | Canal: Sony Pics at Home
-- Fonte: https://www.themoviedb.org/movie/607/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'MIB: Homens de Preto', 'Dois agentes monitoram visitantes de outros planetas que vivem entre os humanos.', 98, 'L', '1997-07-02', 'Barry Sonnenfeld', 'https://image.tmdb.org/t/p/w500/uLOmOF5IzWoyrgIF5MfUnh5pa1X.jpg', 'https://www.youtube.com/watch?v=HYUd7AOw_lk', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('MIB: Homens de Preto', 'Men in Black'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Aventura', 'Comédia', 'Ficção Científica') WHERE f.titulo IN ('MIB: Homens de Preto', 'Men in Black') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=HYUd7AOw_lk' WHERE titulo IN ('MIB: Homens de Preto', 'Men in Black');

-- 54/100: 300
-- Trailer: 300: A Ascensão do Império - Trailer Oficial 1 (leg) [HD] | 7 de março nos cinemas | Canal: Warner Bros. Pictures Brasil
-- Fonte: https://www.themoviedb.org/movie/1271/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT '300', 'Guerreiros espartanos enfrentam um exército muito maior em uma passagem estratégica.', 117, '18', '2007-03-07', 'Zack Snyder', 'https://image.tmdb.org/t/p/w500/h7Lcio0c9ohxPhSZg42eTlKIVVY.jpg', 'https://www.youtube.com/watch?v=hIL3nTSwvXs', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('300', '300'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Aventura', 'Guerra') WHERE f.titulo IN ('300', '300') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=hIL3nTSwvXs' WHERE titulo IN ('300', '300');

-- 55/100: The Terminator
-- Trailer: THE TERMINATOR (1984) | Official Trailer | MGM | Canal: Amazon MGM Studios
-- Fonte: https://www.themoviedb.org/movie/218/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Exterminador do Futuro', 'Uma mulher é perseguida por um assassino enviado do futuro.', 108, '14', '1984-10-26', 'James Cameron', 'https://image.tmdb.org/t/p/w500/qvktm0BHcnmDpul4Hz01GIazWPr.jpg', 'https://www.youtube.com/watch?v=nGrW-OR2uDk', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Exterminador do Futuro', 'The Terminator'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Suspense', 'Ficção Científica') WHERE f.titulo IN ('O Exterminador do Futuro', 'The Terminator') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=nGrW-OR2uDk' WHERE titulo IN ('O Exterminador do Futuro', 'The Terminator');

-- 56/100: GoodFellas
-- Trailer: Goodfellas - Trailer | Canal: Warner On Demand
-- Fonte: https://www.themoviedb.org/movie/769/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Os Bons Companheiros', 'Um jovem entra no crime organizado e acompanha a ascensão e a queda de seus aliados.', 145, '16', '1990-09-12', 'Martin Scorsese', 'https://image.tmdb.org/t/p/w500/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg', 'https://www.youtube.com/watch?v=qWhS8Pjf-9c', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Os Bons Companheiros', 'GoodFellas'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Crime') WHERE f.titulo IN ('Os Bons Companheiros', 'GoodFellas') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=qWhS8Pjf-9c' WHERE titulo IN ('Os Bons Companheiros', 'GoodFellas');

-- 57/100: Ice Age
-- Trailer: Ice Age (2002) Trailer #1 | Movieclips Classic Trailers | Canal: Rotten Tomatoes Classic Trailers
-- Fonte: https://www.themoviedb.org/movie/425/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'A Era do Gelo', 'Animais improváveis se unem para devolver um bebê humano à sua família.', 81, 'L', '2002-03-14', 'Chris Wedge', 'https://image.tmdb.org/t/p/w500/gLhHHZUzeseRXShoDyC4VqLgsNv.jpg', 'https://www.youtube.com/watch?v=i4noiCRJRoE', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('A Era do Gelo', 'Ice Age'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Comédia', 'Família', 'Aventura') WHERE f.titulo IN ('A Era do Gelo', 'Ice Age') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=i4noiCRJRoE' WHERE titulo IN ('A Era do Gelo', 'Ice Age');

-- 58/100: Life Is Beautiful
-- Trailer: Life is Beautiful (1998) Official Trailer - Robert Benigni Movie HD | Canal: Rotten Tomatoes Classic Trailers
-- Fonte: https://www.themoviedb.org/movie/637/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'A Vida É Bela', 'Um pai usa a imaginação para proteger seu filho dos horrores da guerra.', 116, 'L', '1997-12-20', 'Roberto Benigni', 'https://image.tmdb.org/t/p/w500/74hLDKjD5aGYOotO6esUVaeISa2.jpg', 'https://www.youtube.com/watch?v=pAYEQP8gx3w', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('A Vida É Bela', 'Life Is Beautiful'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Comédia', 'Drama') WHERE f.titulo IN ('A Vida É Bela', 'Life Is Beautiful') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=pAYEQP8gx3w' WHERE titulo IN ('A Vida É Bela', 'Life Is Beautiful');

-- 59/100: The Godfather Part II
-- Trailer: The Godfather Part II - Trailer | Canal: Paramount Movies
-- Fonte: https://www.themoviedb.org/movie/240/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Poderoso Chefão: Parte II', 'As trajetórias de Vito e Michael revelam a formação e as tensões da família Corleone.', 202, '14', '1974-12-20', 'Francis Ford Coppola', 'https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg', 'https://www.youtube.com/watch?v=9O1Iy9od7-A', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Poderoso Chefão: Parte II', 'The Godfather Part II'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Crime') WHERE f.titulo IN ('O Poderoso Chefão: Parte II', 'The Godfather Part II') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=9O1Iy9od7-A' WHERE titulo IN ('O Poderoso Chefão: Parte II', 'The Godfather Part II');

-- 60/100: Back to the Future Part II
-- Trailer: Trailer BR - De Volta Para o Futuro 2 [RESTAURADO] | Canal: BTTFBrasilFan
-- Fonte: https://www.themoviedb.org/movie/165/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'De Volta para o Futuro II', 'Marty e Doc atravessam diferentes épocas para corrigir mudanças na história.', 108, 'L', '1989-11-22', 'Robert Zemeckis', 'https://image.tmdb.org/t/p/w500/hQq8xZe5uLjFzSBt4LanNP7SQjl.jpg', 'https://www.youtube.com/watch?v=o7GYCOOS1pc', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('De Volta para o Futuro II', 'Back to the Future Part II'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Comédia', 'Ficção Científica') WHERE f.titulo IN ('De Volta para o Futuro II', 'Back to the Future Part II') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=o7GYCOOS1pc' WHERE titulo IN ('De Volta para o Futuro II', 'Back to the Future Part II');

-- 61/100: Good Will Hunting
-- Trailer: Good Will Hunting | Official Trailer (HD) Robin Williams, Matt Damon, Ben Affleck | MIRAMAX | Canal: Miramax
-- Fonte: https://www.themoviedb.org/movie/489/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Gênio Indomável', 'Um jovem com talento para a matemática precisa enfrentar seus conflitos pessoais.', 127, '14', '1997-12-05', 'Gus Van Sant', 'https://image.tmdb.org/t/p/w500/z2FnLKpFi1HPO7BEJxdkv6hpJSU.jpg', 'https://www.youtube.com/watch?v=ReIJ1lbL-Q8', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Gênio Indomável', 'Good Will Hunting'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama') WHERE f.titulo IN ('Gênio Indomável', 'Good Will Hunting') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=ReIJ1lbL-Q8' WHERE titulo IN ('Gênio Indomável', 'Good Will Hunting');

-- 62/100: The Devil Wears Prada
-- Trailer: The Devil Wears Prada (2006) Trailer #1 | Movieclips Classic Trailers | Canal: Rotten Tomatoes Classic Trailers
-- Fonte: https://www.themoviedb.org/movie/350/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Diabo Veste Prada', 'Uma assistente aprende a lidar com as exigências de uma poderosa editora de moda.', 109, 'L', '2006-06-29', 'David Frankel', 'https://image.tmdb.org/t/p/w500/8912AsVuS7Sj915apArUFbv6F9L.jpg', 'https://www.youtube.com/watch?v=6ZOZwUQKu3E', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Diabo Veste Prada', 'The Devil Wears Prada'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Comédia') WHERE f.titulo IN ('O Diabo Veste Prada', 'The Devil Wears Prada') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=6ZOZwUQKu3E' WHERE titulo IN ('O Diabo Veste Prada', 'The Devil Wears Prada');

-- 63/100: A Clockwork Orange
-- Trailer: A Clockwork Orange | Masterpiece Trailer | Warner Bros. Entertainment | Canal: Warner Bros. Entertainment
-- Fonte: https://www.themoviedb.org/movie/185/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Laranja Mecânica', 'Um jovem violento é submetido a um tratamento experimental de comportamento.', 137, '18', '1971-10-28', 'Stanley Kubrick', 'https://image.tmdb.org/t/p/w500/4sHeTAp65WrSSuc05nRBKddhBxO.jpg', 'https://www.youtube.com/watch?v=vN-1Mup0UI0', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Laranja Mecânica', 'A Clockwork Orange'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ficção Científica', 'Crime') WHERE f.titulo IN ('Laranja Mecânica', 'A Clockwork Orange') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=vN-1Mup0UI0' WHERE titulo IN ('Laranja Mecânica', 'A Clockwork Orange');

-- 64/100: Edward Scissorhands
-- Trailer: Edward Scissorhands (1990) Original Trailer [FHD] | Canal: HD Retro Trailers
-- Fonte: https://www.themoviedb.org/movie/162/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Edward Mãos de Tesoura', 'Um jovem com tesouras no lugar das mãos tenta encontrar seu lugar em uma comunidade.', 105, 'L', '1990-12-07', 'Tim Burton', 'https://image.tmdb.org/t/p/w500/e0FqKFvGPdQNWG8tF9cZBtev9Em.jpg', 'https://www.youtube.com/watch?v=S8bBjpUBbro', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Edward Mãos de Tesoura', 'Edward Scissorhands'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Fantasia', 'Drama', 'Romance') WHERE f.titulo IN ('Edward Mãos de Tesoura', 'Edward Scissorhands') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=S8bBjpUBbro' WHERE titulo IN ('Edward Mãos de Tesoura', 'Edward Scissorhands');

-- 65/100: Raiders of the Lost Ark
-- Trailer: INDIANA JONES E OS CAÇADORES DA ARCA PERDIDA | Official Trailer | Paramount Movies | Canal: Paramount Entertainment Brasil
-- Fonte: https://www.themoviedb.org/movie/85/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Indiana Jones e os Caçadores da Arca Perdida', 'Um arqueólogo disputa com forças nazistas a descoberta de uma relíquia antiga.', 115, 'L', '1981-06-12', 'Steven Spielberg', 'https://image.tmdb.org/t/p/w500/ceG9VzoRAVGwivFU403Wc3AHRys.jpg', 'https://www.youtube.com/watch?v=JsxYJs4UyJI', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Indiana Jones e os Caçadores da Arca Perdida', 'Raiders of the Lost Ark'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Ação') WHERE f.titulo IN ('Indiana Jones e os Caçadores da Arca Perdida', 'Raiders of the Lost Ark') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=JsxYJs4UyJI' WHERE titulo IN ('Indiana Jones e os Caçadores da Arca Perdida', 'Raiders of the Lost Ark');

-- 66/100: Shrek 2
-- Trailer: Shrek 2 - Official Trailer 2004 [HD] | Canal: Animation Trailers
-- Fonte: https://www.themoviedb.org/movie/809/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Shrek 2', 'Shrek e Fiona visitam a família dela e enfrentam expectativas sobre seu casamento.', 92, 'L', '2004-05-19', 'Andrew Adamson, Kelly Asbury, Conrad Vernon', 'https://image.tmdb.org/t/p/w500/2yYP0PQjG8zVqturh1BAqu2Tixl.jpg', 'https://www.youtube.com/watch?v=dB7a9utApIQ', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Shrek 2', 'Shrek 2'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Comédia', 'Família', 'Fantasia', 'Romance') WHERE f.titulo IN ('Shrek 2', 'Shrek 2') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=dB7a9utApIQ' WHERE titulo IN ('Shrek 2', 'Shrek 2');

-- 67/100: Taxi Driver
-- Trailer: Taxi Driver - official reissue trailer | Canal: Park Circus
-- Fonte: https://www.themoviedb.org/movie/103/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Taxi Driver', 'Um taxista solitário percorre Nova York enquanto se afasta cada vez mais da sociedade.', 114, '16', '1976-02-09', 'Martin Scorsese', 'https://image.tmdb.org/t/p/w500/ekstpH614fwDX8DUln1a2Opz0N8.jpg', 'https://www.youtube.com/watch?v=S7ORyD-e7-0', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Taxi Driver', 'Taxi Driver'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Crime', 'Drama') WHERE f.titulo IN ('Taxi Driver', 'Taxi Driver') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=S7ORyD-e7-0' WHERE titulo IN ('Taxi Driver', 'Taxi Driver');

-- 68/100: Donnie Darko
-- Trailer: Donnie Darko - Official Trailer | Canal: Madman Films
-- Fonte: https://www.themoviedb.org/movie/141/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Donnie Darko', 'Um adolescente passa a receber mensagens sobre um possível fim do mundo.', 114, '14', '2001-01-19', 'Richard Kelly', 'https://image.tmdb.org/t/p/w500/j2AtZFsflxiluaNtajMTI0Avm8C.jpg', 'https://www.youtube.com/watch?v=bzLn8sYeM9o', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Donnie Darko', 'Donnie Darko'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Fantasia', 'Drama', 'Mistério') WHERE f.titulo IN ('Donnie Darko', 'Donnie Darko') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=bzLn8sYeM9o' WHERE titulo IN ('Donnie Darko', 'Donnie Darko');

-- 69/100: Scarface
-- Trailer: Scarface Trailer - Own it on Blu-ray  September 6, 2011 | Canal: Universal Pictures At Home
-- Fonte: https://www.themoviedb.org/movie/111/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Scarface', 'Um imigrante constrói um império do crime movido por ambição e violência.', 170, '18', '1983-12-09', 'Brian De Palma', 'https://image.tmdb.org/t/p/w500/iQ5ztdjvteGeboxtmRdXEChJOHh.jpg', 'https://www.youtube.com/watch?v=QyM1mQHz_2U', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Scarface', 'Scarface'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Crime', 'Drama') WHERE f.titulo IN ('Scarface', 'Scarface') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=QyM1mQHz_2U' WHERE titulo IN ('Scarface', 'Scarface');

-- 70/100: American Beauty
-- Trailer: American Beauty - Trailer | Canal: YouTube Movies
-- Fonte: https://www.themoviedb.org/movie/14/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Beleza Americana', 'Uma família suburbana enfrenta desejos, frustrações e mudanças inesperadas.', 122, '18', '1999-09-15', 'Sam Mendes', 'https://image.tmdb.org/t/p/w500/wby9315QzVKdW9BonAefg8jGTTb.jpg', 'https://www.youtube.com/watch?v=3ycmmJ6rxA8', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Beleza Americana', 'American Beauty'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama') WHERE f.titulo IN ('Beleza Americana', 'American Beauty') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=3ycmmJ6rxA8' WHERE titulo IN ('Beleza Americana', 'American Beauty');

-- 71/100: The Sixth Sense
-- Trailer: The Sixth Sense Trailer HD | Canal: FilmTrailersChannel
-- Fonte: https://www.themoviedb.org/movie/745/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Sexto Sentido', 'Um psicólogo acompanha um menino que afirma ver pessoas mortas.', 107, '12', '1999-08-06', 'M. Night Shyamalan', 'https://image.tmdb.org/t/p/w500/vOyfUXNFSnaTk7Vk5AjpsKTUWsu.jpg', 'https://www.youtube.com/watch?v=VG9AGf66tXM', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Sexto Sentido', 'The Sixth Sense'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Mistério', 'Suspense', 'Drama') WHERE f.titulo IN ('O Sexto Sentido', 'The Sixth Sense') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=VG9AGf66tXM' WHERE titulo IN ('O Sexto Sentido', 'The Sixth Sense');

-- 72/100: The Incredible Hulk
-- Trailer: The Incredible Hulk - Trailer | Canal: Universal Pictures At Home
-- Fonte: https://www.themoviedb.org/movie/1724/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Incrível Hulk', 'Bruce Banner busca uma cura enquanto tenta controlar uma transformação poderosa.', 114, '10', '2008-06-12', 'Louis Leterrier', 'https://image.tmdb.org/t/p/w500/gKzYx79y0AQTL4UAk1cBQJ3nvrm.jpg', 'https://www.youtube.com/watch?v=dz6eBeW19Lg', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Incrível Hulk', 'The Incredible Hulk'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ficção Científica', 'Ação', 'Aventura') WHERE f.titulo IN ('O Incrível Hulk', 'The Incredible Hulk') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=dz6eBeW19Lg' WHERE titulo IN ('O Incrível Hulk', 'The Incredible Hulk');

-- 73/100: Dead Poets Society
-- Trailer: Dead Poets Society ≣ 1989 ≣ Trailer | Canal: TrailerTrackerEnglish
-- Fonte: https://www.themoviedb.org/movie/207/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Sociedade dos Poetas Mortos', 'Um professor incentiva seus alunos a encontrar sua própria voz por meio da poesia.', 129, '12', '1989-06-02', 'Peter Weir', 'https://image.tmdb.org/t/p/w500/tNvKkSnnn4Z6RCBThyK1gfCSSvv.jpg', 'https://www.youtube.com/watch?v=rLCJaTDdWtw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Sociedade dos Poetas Mortos', 'Dead Poets Society'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama') WHERE f.titulo IN ('Sociedade dos Poetas Mortos', 'Dead Poets Society') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=rLCJaTDdWtw' WHERE titulo IN ('Sociedade dos Poetas Mortos', 'Dead Poets Society');

-- 74/100: 2001: A Space Odyssey
-- Trailer: 2001: Odisseia no Espaço - Trailer Oficial Legendado Português | Canal: WarnerBrosPortugal
-- Fonte: https://www.themoviedb.org/movie/62/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT '2001: Uma Odisseia no Espaço', 'Uma missão espacial e um computador avançado desafiam a compreensão humana.', 149, 'L', '1968-04-02', 'Stanley Kubrick', 'https://image.tmdb.org/t/p/w500/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg', 'https://www.youtube.com/watch?v=7E9CD3Hucws', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('2001: Uma Odisseia no Espaço', '2001: A Space Odyssey'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ficção Científica', 'Mistério', 'Aventura') WHERE f.titulo IN ('2001: Uma Odisseia no Espaço', '2001: A Space Odyssey') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=7E9CD3Hucws' WHERE titulo IN ('2001: Uma Odisseia no Espaço', '2001: A Space Odyssey');

-- 75/100: American History X
-- Trailer: American History X (1998) Original Trailer [HD] | Canal: HD Retro Trailers
-- Fonte: https://www.themoviedb.org/movie/73/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'A Outra História Americana', 'Dois irmãos enfrentam as consequências do extremismo e da violência racial.', 119, '18', '1998-07-01', 'Tony Kaye', 'https://image.tmdb.org/t/p/w500/x2drgoXYZ8484lqyDj7L1CEVR4T.jpg', 'https://www.youtube.com/watch?v=el6JxnW2Tyg', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('A Outra História Americana', 'American History X'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama') WHERE f.titulo IN ('A Outra História Americana', 'American History X') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=el6JxnW2Tyg' WHERE titulo IN ('A Outra História Americana', 'American History X');

-- 76/100: Ocean's Eleven
-- Trailer: Oceans Eleven (2001) - Original Theatrical Trailer | Canal: Warner Bros. Rewind
-- Fonte: https://www.themoviedb.org/movie/161/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Onze Homens e um Segredo', 'Um grupo de especialistas planeja um assalto ousado a cassinos de Las Vegas.', 116, '12', '2001-12-07', 'Steven Soderbergh', 'https://image.tmdb.org/t/p/w500/hQQCdZrsHtZyR6NbKH2YyCqd2fR.jpg', 'https://www.youtube.com/watch?v=n3epi9hPbqQ', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Onze Homens e um Segredo', 'Ocean\'s Eleven'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Suspense', 'Crime') WHERE f.titulo IN ('Onze Homens e um Segredo', 'Ocean\'s Eleven') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=n3epi9hPbqQ' WHERE titulo IN ('Onze Homens e um Segredo', 'Ocean\'s Eleven');

-- 77/100: Home Alone
-- Trailer: Home Alone Official Trailer | Canal: Park Circus
-- Fonte: https://www.themoviedb.org/movie/771/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Esqueceram de Mim', 'Um menino fica sozinho em casa e precisa enfrentar dois ladrões.', 103, 'L', '1990-11-16', 'Chris Columbus', 'https://image.tmdb.org/t/p/w500/onTSipZ8R3bliBdKfPtsDuHTdlL.jpg', 'https://www.youtube.com/watch?v=dzdpqRGA1qc', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Esqueceram de Mim', 'Home Alone'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Comédia', 'Família') WHERE f.titulo IN ('Esqueceram de Mim', 'Home Alone') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=dzdpqRGA1qc' WHERE titulo IN ('Esqueceram de Mim', 'Home Alone');

-- 78/100: Amélie
-- Trailer: Amélie | Official Trailer (HD) - Audrey Tautou | MIRAMAX | Canal: Miramax
-- Fonte: https://www.themoviedb.org/movie/194/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Fabuloso Destino de Amélie Poulain', 'Uma jovem parisiense decide transformar discretamente a vida das pessoas ao seu redor.', 122, '14', '2001-04-25', 'Jean-Pierre Jeunet', 'https://image.tmdb.org/t/p/w500/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg', 'https://www.youtube.com/watch?v=2UT5xaAfxWU', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Fabuloso Destino de Amélie Poulain', 'Amélie'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Comédia', 'Romance') WHERE f.titulo IN ('O Fabuloso Destino de Amélie Poulain', 'Amélie') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=2UT5xaAfxWU' WHERE titulo IN ('O Fabuloso Destino de Amélie Poulain', 'Amélie');

-- 79/100: American Psycho
-- Trailer: American Psycho - Trailer | Canal: LionsgateVOD
-- Fonte: https://www.themoviedb.org/movie/1359/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Psicopata Americano', 'Um executivo de aparência perfeita esconde impulsos violentos e uma vida perturbadora.', 102, '18', '2000-04-13', 'Mary Harron', 'https://image.tmdb.org/t/p/w500/9uGHEgsiUXjCNq8wdq4r49YL8A1.jpg', 'https://www.youtube.com/watch?v=5YnGhW4UEhc', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Psicopata Americano', 'American Psycho'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Suspense', 'Drama', 'Crime') WHERE f.titulo IN ('Psicopata Americano', 'American Psycho') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=5YnGhW4UEhc' WHERE titulo IN ('Psicopata Americano', 'American Psycho');

-- 80/100: Die Hard
-- Trailer: Die Hard | 30th Anniversary Trailer | 20th Century FOX | Canal: 20th Century Studios
-- Fonte: https://www.themoviedb.org/movie/562/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Duro de Matar', 'Um policial tenta impedir um grupo armado que tomou um edifício e fez reféns.', 132, '14', '1988-07-15', 'John McTiernan', 'https://image.tmdb.org/t/p/w500/7Bjd8kfmDSOzpmhySpEhkUyK2oH.jpg', 'https://www.youtube.com/watch?v=gYWvwkXreaI', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Duro de Matar', 'Die Hard'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Suspense') WHERE f.titulo IN ('Duro de Matar', 'Die Hard') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=gYWvwkXreaI' WHERE titulo IN ('Duro de Matar', 'Die Hard');

-- 81/100: The Big Lebowski
-- Trailer: Official Trailer | The Big Lebowski | Screen Bites | Canal: Screen Bites
-- Fonte: https://www.themoviedb.org/movie/115/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Grande Lebowski', 'Um homem tranquilo é envolvido em um caso de identidade trocada e chantagem.', 117, '16', '1998-03-06', 'Joel Coen, Ethan Coen', 'https://image.tmdb.org/t/p/w500/3bv6WAp6BSxxYvB5ozKFUYuRA8C.jpg', 'https://www.youtube.com/watch?v=cd-go0oBF4Y', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Grande Lebowski', 'The Big Lebowski'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Comédia', 'Crime') WHERE f.titulo IN ('O Grande Lebowski', 'The Big Lebowski') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=cd-go0oBF4Y' WHERE titulo IN ('O Grande Lebowski', 'The Big Lebowski');

-- 82/100: Aladdin
-- Trailer: Aladdin - Walt Disney -  Trailer 1992 (35mm frame by frame) | Canal: UniversTrailers
-- Fonte: https://www.themoviedb.org/movie/812/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Aladdin', 'Um jovem encontra uma lâmpada mágica e tenta conquistar um novo destino.', 91, 'L', '1992-11-25', 'Ron Clements, John Musker', 'https://image.tmdb.org/t/p/w500/eLFfl7vS8dkeG1hKp5mwbm37V83.jpg', 'https://www.youtube.com/watch?v=YN7C1657K1E', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Aladdin', 'Aladdin'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Animação', 'Família', 'Aventura', 'Fantasia', 'Romance') WHERE f.titulo IN ('Aladdin', 'Aladdin') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=YN7C1657K1E' WHERE titulo IN ('Aladdin', 'Aladdin');

-- 83/100: E.T. the Extra-Terrestrial
-- Trailer: E.T. The Extra-Terrestrial - Trailer | Canal: Universal Pictures At Home
-- Fonte: https://www.themoviedb.org/movie/601/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'E.T.: O Extraterrestre', 'Um menino faz amizade com um visitante de outro planeta e tenta ajudá-lo a voltar para casa.', 115, 'L', '1982-06-11', 'Steven Spielberg', 'https://image.tmdb.org/t/p/w500/an0nD6uq6byfxXCfk6lQBzdL2J1.jpg', 'https://www.youtube.com/watch?v=wZNInG8kSiA', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('E.T.: O Extraterrestre', 'E.T. the Extra-Terrestrial'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Ficção Científica', 'Família') WHERE f.titulo IN ('E.T.: O Extraterrestre', 'E.T. the Extra-Terrestrial') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=wZNInG8kSiA' WHERE titulo IN ('E.T.: O Extraterrestre', 'E.T. the Extra-Terrestrial');

-- 84/100: The Matrix Reloaded
-- Trailer: The Matrix Reloaded - Original Theatrical Trailer | Canal: Warner Bros. Rewind
-- Fonte: https://www.themoviedb.org/movie/604/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Matrix Reloaded', 'Neo e seus aliados buscam respostas enquanto a resistência humana enfrenta uma nova ofensiva.', 138, '14', '2003-05-15', 'Lana Wachowski, Lilly Wachowski', 'https://image.tmdb.org/t/p/w500/aA5qHS0FbSXO8PxcxUIHbDrJyuh.jpg', 'https://www.youtube.com/watch?v=zmYE3tg26Qc', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Matrix Reloaded', 'The Matrix Reloaded'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Ação', 'Suspense', 'Ficção Científica') WHERE f.titulo IN ('Matrix Reloaded', 'The Matrix Reloaded') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=zmYE3tg26Qc' WHERE titulo IN ('Matrix Reloaded', 'The Matrix Reloaded');

-- 85/100: The Fifth Element
-- Trailer: The Fifth Element Trailer | TNT | Canal: TNT
-- Fonte: https://www.themoviedb.org/movie/18/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Quinto Elemento', 'Um motorista se envolve em uma missão para impedir uma ameaça cósmica.', 126, '12', '1997-05-02', 'Luc Besson', 'https://image.tmdb.org/t/p/w500/fPtlCO1yQtnoLHOwKtWz7db6RGU.jpg', 'https://www.youtube.com/watch?v=FrEf8XHToGI', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Quinto Elemento', 'The Fifth Element'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ficção Científica', 'Ação', 'Aventura') WHERE f.titulo IN ('O Quinto Elemento', 'The Fifth Element') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=FrEf8XHToGI' WHERE titulo IN ('O Quinto Elemento', 'The Fifth Element');

-- 86/100: Madagascar
-- Trailer: MADAGASCAR | Official Trailer | Canal: Universal Kids
-- Fonte: https://www.themoviedb.org/movie/953/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Madagascar', 'Animais de um zoológico deixam Nova York e precisam se adaptar à vida selvagem.', 86, 'L', '2005-05-25', 'Eric Darnell, Tom McGrath', 'https://image.tmdb.org/t/p/w500/zMpJY5CJKUufG9OTw0In4eAFqPX.jpg', 'https://www.youtube.com/watch?v=fq5zU9T_Hl4', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Madagascar', 'Madagascar'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Animação', 'Comédia', 'Família') WHERE f.titulo IN ('Madagascar', 'Madagascar') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=fq5zU9T_Hl4' WHERE titulo IN ('Madagascar', 'Madagascar');

-- 87/100: Jaws
-- Trailer: Jaws | Official Rerelease Trailer | Park Circus | Canal: Park Circus
-- Fonte: https://www.themoviedb.org/movie/578/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Tubarão', 'Uma cidade litorânea enfrenta os ataques de um enorme tubarão.', 124, '14', '1975-06-20', 'Steven Spielberg', 'https://image.tmdb.org/t/p/w500/lxM6kqilAdpdhqUl2biYp5frUxE.jpg', 'https://www.youtube.com/watch?v=YIhxgIZJSbk', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Tubarão', 'Jaws'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Terror', 'Suspense', 'Aventura') WHERE f.titulo IN ('Tubarão', 'Jaws') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=YIhxgIZJSbk' WHERE titulo IN ('Tubarão', 'Jaws');

-- 88/100: Back to the Future Part III
-- Trailer: BACK TO THE FUTURE PART III (1990) | Theatrical Trailer | Amblin | Canal: Amblin Entertainment
-- Fonte: https://www.themoviedb.org/movie/196/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'De Volta para o Futuro III', 'Marty viaja ao Velho Oeste para resgatar Doc e encontrar um caminho de volta.', 119, 'L', '1990-05-25', 'Robert Zemeckis', 'https://image.tmdb.org/t/p/w500/crzoVQnMzIrRfHtQw0tLBirNfVg.jpg', 'https://www.youtube.com/watch?v=DTdBq1fQOBU', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('De Volta para o Futuro III', 'Back to the Future Part III'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Comédia', 'Ficção Científica') WHERE f.titulo IN ('De Volta para o Futuro III', 'Back to the Future Part III') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=DTdBq1fQOBU' WHERE titulo IN ('De Volta para o Futuro III', 'Back to the Future Part III');

-- 89/100: The Chronicles of Narnia: The Lion, the Witch and the Wardrobe
-- Trailer: The Chronicles of Narnia: The Lion, the Witch and the Wardrobe (2005) Trailer | Canal: Movie Trailer Locker
-- Fonte: https://www.themoviedb.org/movie/411/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa', 'Quatro irmãos atravessam um guarda-roupa e encontram um reino sob o domínio de uma feiticeira.', 143, '10', '2005-12-07', 'Andrew Adamson', 'https://image.tmdb.org/t/p/w500/iREd0rNCjYdf5Ar0vfaW32yrkm.jpg', 'https://www.youtube.com/watch?v=3mKPrxjwF7A', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa', 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Família', 'Fantasia') WHERE f.titulo IN ('As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa', 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=3mKPrxjwF7A' WHERE titulo IN ('As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa', 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe');

-- 90/100: Bruce Almighty
-- Trailer: Todo Poderoso 2003 Trailer Oficial Legendado | Canal: SóTrailers
-- Fonte: https://www.themoviedb.org/movie/310/videos?language=pt-BR&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Todo Poderoso', 'Um homem recebe poderes extraordinários e descobre as dificuldades de atender a todos.', 101, 'L', '2003-05-23', 'Tom Shadyac', 'https://image.tmdb.org/t/p/w500/wqkWrOFtYnZSvIMu8Lsmz7WIvKC.jpg', 'https://www.youtube.com/watch?v=9BqL0M3DZ1E', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Todo Poderoso', 'Bruce Almighty'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Fantasia', 'Comédia') WHERE f.titulo IN ('Todo Poderoso', 'Bruce Almighty') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=9BqL0M3DZ1E' WHERE titulo IN ('Todo Poderoso', 'Bruce Almighty');

-- 91/100: Full Metal Jacket
-- Trailer: Full Metal Jacket - Official Trailer [1987] HD | Canal: Stanley Kubrick
-- Fonte: https://www.themoviedb.org/movie/600/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Nascido para Matar', 'Soldados passam por treinamento e enfrentam os conflitos da Guerra do Vietnã.', 117, '18', '1987-06-26', 'Stanley Kubrick', 'https://image.tmdb.org/t/p/w500/kMKyx1k8hWWscYFnPbnxxN4Eqo4.jpg', 'https://www.youtube.com/watch?v=3Un-WBlVHPw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Nascido para Matar', 'Full Metal Jacket'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Guerra') WHERE f.titulo IN ('Nascido para Matar', 'Full Metal Jacket') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=3Un-WBlVHPw' WHERE titulo IN ('Nascido para Matar', 'Full Metal Jacket');

-- 92/100: Pan's Labyrinth
-- Trailer: PAN'S LABYRINTH - Official Trailer - Directed by Guillermo del Toro | Canal: StudiocanalUK
-- Fonte: https://www.themoviedb.org/movie/1417/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Labirinto do Fauno', 'Uma menina encontra um mundo fantástico em meio à violência da Espanha do pós-guerra.', 118, '16', '2006-10-11', 'Guillermo del Toro', 'https://image.tmdb.org/t/p/w500/z7xXihu5wHuSMWymq5VAulPVuvg.jpg', 'https://www.youtube.com/watch?v=jVZRnnVSQ8k', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Labirinto do Fauno', 'Pan\'s Labyrinth'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Fantasia', 'Drama', 'Guerra') WHERE f.titulo IN ('O Labirinto do Fauno', 'Pan\'s Labyrinth') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=jVZRnnVSQ8k' WHERE titulo IN ('O Labirinto do Fauno', 'Pan\'s Labyrinth');

-- 93/100: One Flew Over the Cuckoo's Nest
-- Trailer: One Flew Over the Cuckoo's Nest | 4K Restoration - Official UK Trailer | Canal: Curzon
-- Fonte: https://www.themoviedb.org/movie/510/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Um Estranho no Ninho', 'Um novo paciente desafia as regras de uma instituição psiquiátrica.', 135, '14', '1975-11-19', 'Miloš Forman', 'https://image.tmdb.org/t/p/w500/kjWsMh72V6d8KRLV4EOoSJLT1H7.jpg', 'https://www.youtube.com/watch?v=F4da9uRIg8c', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Um Estranho no Ninho', 'One Flew Over the Cuckoo\'s Nest'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama') WHERE f.titulo IN ('Um Estranho no Ninho', 'One Flew Over the Cuckoo\'s Nest') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=F4da9uRIg8c' WHERE titulo IN ('Um Estranho no Ninho', 'One Flew Over the Cuckoo\'s Nest');

-- 94/100: The Usual Suspects
-- Trailer: The Usual Suspects - Trailer | Canal: Paramount Movies Digital
-- Fonte: https://www.themoviedb.org/movie/629/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Os Suspeitos', 'Um interrogatório tenta esclarecer a ligação entre criminosos e um misterioso chefe do crime.', 106, '14', '1995-07-19', 'Bryan Singer', 'https://image.tmdb.org/t/p/w500/99X2SgyFunJFXGAYnDv3sb9pnUD.jpg', 'https://www.youtube.com/watch?v=x3t0Nc6fg7w', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Os Suspeitos', 'The Usual Suspects'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Crime', 'Suspense') WHERE f.titulo IN ('Os Suspeitos', 'The Usual Suspects') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=x3t0Nc6fg7w' WHERE titulo IN ('Os Suspeitos', 'The Usual Suspects');

-- 95/100: The Mask
-- Trailer: The Mask | Theatrical Trailer | Warner Bros. Rewind | Canal: Warner Bros. Rewind
-- Fonte: https://www.themoviedb.org/movie/854/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'O Máskara', 'Um bancário encontra uma máscara que libera uma personalidade com poderes extraordinários.', 101, 'L', '1994-07-29', 'Chuck Russell', 'https://image.tmdb.org/t/p/w500/jPC2eYub74zwf2tPGVtzSlBW6Oy.jpg', 'https://www.youtube.com/watch?v=hOqVRwGVUkA', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('O Máskara', 'The Mask'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Comédia', 'Fantasia', 'Crime', 'Romance') WHERE f.titulo IN ('O Máskara', 'The Mask') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=hOqVRwGVUkA' WHERE titulo IN ('O Máskara', 'The Mask');

-- 96/100: Mr. & Mrs. Smith
-- Trailer: Mr And Mrs Smith Teaser [HD] | Canal: FilmTrailersChannel
-- Fonte: https://www.themoviedb.org/movie/787/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Sr. e Sra. Smith', 'Um casal descobre que ambos escondem carreiras como assassinos profissionais.', 120, '14', '2005-06-07', 'Doug Liman', 'https://image.tmdb.org/t/p/w500/kjD700RtyhveN3ZbOnSvUSne0Qj.jpg', 'https://www.youtube.com/watch?v=TWB_icm5M38', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Sr. e Sra. Smith', 'Mr. & Mrs. Smith'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Comédia', 'Drama', 'Suspense') WHERE f.titulo IN ('Sr. e Sra. Smith', 'Mr. & Mrs. Smith') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=TWB_icm5M38' WHERE titulo IN ('Sr. e Sra. Smith', 'Mr. & Mrs. Smith');

-- 97/100: Braveheart
-- Trailer: Braveheart - Trailer | Canal: Paramount Movies
-- Fonte: https://www.themoviedb.org/movie/197/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Coração Valente', 'Um guerreiro lidera uma revolta pela liberdade da Escócia.', 178, '16', '1995-05-24', 'Mel Gibson', 'https://image.tmdb.org/t/p/w500/or1gBugydmjToAEq7OZY0owwFk.jpg', 'https://www.youtube.com/watch?v=nMft5QDOHek', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Coração Valente', 'Braveheart'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Ação', 'Drama', 'História', 'Guerra') WHERE f.titulo IN ('Coração Valente', 'Braveheart') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=nMft5QDOHek' WHERE titulo IN ('Coração Valente', 'Braveheart');

-- 98/100: Troy
-- Trailer: Troy | Official Trailer | 4K | Canal: Arrow Video
-- Fonte: https://www.themoviedb.org/movie/652/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Troia', 'Uma disputa entre reinos leva heróis e exércitos ao cerco de Troia.', 163, '14', '2004-05-13', 'Wolfgang Petersen', 'https://image.tmdb.org/t/p/w500/a07wLy4ONfpsjnBqMwhlWTJTcm.jpg', 'https://www.youtube.com/watch?v=P8xLgg-MNKw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Troia', 'Troy'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Guerra', 'Ação', 'História') WHERE f.titulo IN ('Troia', 'Troy') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=P8xLgg-MNKw' WHERE titulo IN ('Troia', 'Troy');

-- 99/100: A Beautiful Mind
-- Trailer: A Beautiful Mind - Trailer | Canal: YouTube Movies
-- Fonte: https://www.themoviedb.org/movie/453/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Uma Mente Brilhante', 'Um matemático enfrenta desafios pessoais enquanto desenvolve seu trabalho.', 135, '10', '2001-12-14', 'Ron Howard', 'https://image.tmdb.org/t/p/w500/rEIg5yJdNOt9fmX4P8gU9LeNoTQ.jpg', 'https://www.youtube.com/watch?v=WFJgUm7iOKw', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Uma Mente Brilhante', 'A Beautiful Mind'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Drama', 'Romance') WHERE f.titulo IN ('Uma Mente Brilhante', 'A Beautiful Mind') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=WFJgUm7iOKw' WHERE titulo IN ('Uma Mente Brilhante', 'A Beautiful Mind');

-- 100/100: Indiana Jones and the Last Crusade
-- Trailer: Indiana Jones and the Last Crusade (1989) | Trailer | Paramount Pictures Australia | Canal: Paramount Pictures Australia
-- Fonte: https://www.themoviedb.org/movie/89/videos?language=en-US&active_nav_item=Trailers
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, status)
SELECT 'Indiana Jones e a Última Cruzada', 'Indiana Jones procura seu pai e uma relíquia lendária em uma nova aventura.', 127, 'L', '1989-05-24', 'Steven Spielberg', 'https://image.tmdb.org/t/p/w500/sizg1AU8f8JDZX4QIgE4pjUMBvx.jpg', 'https://www.youtube.com/watch?v=xV7qk3nuoUU', TRUE, TRUE, 'ATIVO'
WHERE NOT EXISTS (SELECT 1 FROM filmes WHERE titulo IN ('Indiana Jones e a Última Cruzada', 'Indiana Jones and the Last Crusade'));
INSERT INTO filme_generos (id_filme, id_genero) SELECT f.id_filme, g.id_genero FROM filmes f JOIN generos g ON g.nome IN ('Aventura', 'Ação') WHERE f.titulo IN ('Indiana Jones e a Última Cruzada', 'Indiana Jones and the Last Crusade') AND NOT EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_filme = f.id_filme AND fg.id_genero = g.id_genero);
UPDATE filmes SET trailer = 'https://www.youtube.com/watch?v=xV7qk3nuoUU' WHERE titulo IN ('Indiana Jones e a Última Cruzada', 'Indiana Jones and the Last Crusade');
COMMIT;
-- END CINEASTRA_CATALOGO_100
