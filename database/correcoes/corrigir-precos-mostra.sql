-- CineAstra | Corrigir a inteira das sessões futuras da Mostra CineAstra.
-- MySQL 8. Selecione o banco usado pelo backend. Execute o arquivo inteiro
-- em uma única conexão, sem --force. Exemplo (a senha será solicitada):
-- mysql --default-character-set=utf8mb4 -h HOST -u USUARIO -p BANCO < corrigir-precos-mostra.sql
-- A primeira consulta lista os ajustes. A última informa o total aplicado.
-- Uma nova execução após o ajuste deve indicar zero alterações.
SET NAMES utf8mb4;
START TRANSACTION;

CREATE TEMPORARY TABLE ajuste_preco_mostra (
    id_sessao BIGINT UNSIGNED PRIMARY KEY,
    preco_anterior DECIMAL(10,2) NOT NULL,
    preco_correto DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

INSERT INTO ajuste_preco_mostra (id_sessao, preco_anterior, preco_correto)
WITH custos AS (
    SELECT s.id_sessao, s.preco_inteira, p.markup_bps,
           ROUND((ROUND(s.custo_local_dia * 100 *
               MOD(TIME_TO_SEC(s.horario_fim) DIV 60 - TIME_TO_SEC(s.horario_inicio) DIV 60 + 1440, 1440)
               / 1440, 0) + s.custo_exibicao * 100)
               / LEAST(a.capacidade, p.ocupacao_referencia), 0) AS custo_centavos
    FROM sessoes s
    JOIN salas a ON a.id_sala = s.id_sala
    JOIN filmes f ON f.id_filme = s.id_filme
    JOIN locais l ON l.id_local = a.id_local
    JOIN precificacao_parametros p ON p.categoria = 'SESSION'
    WHERE s.status IN ('AGENDADA','EM_CARTAZ')
      AND s.arquivada_em IS NULL
      AND TIMESTAMP(s.data, s.horario_inicio) > UTC_TIMESTAMP()
      AND s.preco_inteira = 32.00
      AND s.custo_local_dia = 80.00 AND s.custo_exibicao = 120.00
      AND s.horario_inicio = '19:30:00' AND s.idioma = 'DUBLADO'
      AND (l.nome, f.titulo) IN (
          ('CineAstra Paulista', 'Batman: O Cavaleiro das Trevas'),
          ('CineAstra Shopping ABC', 'A Viagem de Chihiro'),
          ('CineAstra Campinas', 'Homem-Aranha 2')
      )
      AND EXISTS (SELECT 1 FROM equipes e WHERE e.id_sessao = s.id_sessao
          AND e.nome = CONCAT('Mostra CineAstra · ', DATE_FORMAT(s.data, '%d/%m')))
    FOR UPDATE
), precos AS (
    SELECT id_sessao, preco_inteira,
           (custo_centavos + ROUND(custo_centavos * markup_bps / 10000, 0)) / 100 AS preco
    FROM custos
)
SELECT id_sessao, preco_inteira, preco FROM precos WHERE preco <> preco_inteira;

SELECT id_sessao, preco_anterior, preco_correto FROM ajuste_preco_mostra ORDER BY id_sessao;
UPDATE sessoes s JOIN ajuste_preco_mostra a ON a.id_sessao = s.id_sessao
SET s.preco_inteira = a.preco_correto
WHERE s.preco_inteira = a.preco_anterior;
SET @mostra_atualizadas = ROW_COUNT();
COMMIT;
DROP TEMPORARY TABLE ajuste_preco_mostra;
SELECT DATABASE() AS banco, @mostra_atualizadas AS sessoes_atualizadas;
