-- Revisão no banco de destino. O primeiro resultado lista equivalências exatas.
-- Nenhum nome aproximado, campanha, categoria de newsletter ou destinação é mesclado.
SET NAMES utf8mb4;
START TRANSACTION;

CREATE TEMPORARY TABLE marketing_copias_equivalentes (
    copia INT UNSIGNED PRIMARY KEY,
    original INT UNSIGNED NOT NULL
);

INSERT INTO marketing_copias_equivalentes (copia, original)
SELECT copia.id_conteudo,MIN(original.id_conteudo)
FROM conteudos_promocionais copia
JOIN conteudos_promocionais original ON original.tipo=copia.tipo
  AND original.id_conteudo<copia.id_conteudo
  AND original.ativo=TRUE
  AND original.id_local_evento <=> copia.id_local_evento
  AND original.id_promocao <=> copia.id_promocao
  AND CAST(original.dados AS BINARY)=CAST(copia.dados AS BINARY)
WHERE copia.ativo=TRUE AND copia.tipo IN ('banners','partners')
  AND NOT EXISTS (SELECT 1 FROM combos c WHERE c.id_evento=copia.id_conteudo)
  AND NOT EXISTS (SELECT 1 FROM solicitacoes_experiencia e WHERE e.id_experiencia=copia.id_conteudo)
GROUP BY copia.id_conteudo;

SELECT equivalencia.copia,equivalencia.original,p.tipo,p.slug
FROM marketing_copias_equivalentes equivalencia JOIN conteudos_promocionais p ON p.id_conteudo=equivalencia.copia
ORDER BY p.tipo,equivalencia.copia;

-- Oculta cópias equivalentes sem referência operacional. Preserva todas as linhas.
UPDATE conteudos_promocionais p JOIN marketing_copias_equivalentes equivalencia ON equivalencia.copia=p.id_conteudo
JOIN conteudos_promocionais original ON original.id_conteudo=equivalencia.original
SET p.ativo=FALSE
WHERE original.ativo=TRUE
  AND CAST(original.dados AS BINARY)=CAST(p.dados AS BINARY)
  AND original.id_local_evento <=> p.id_local_evento AND original.id_promocao <=> p.id_promocao
  AND NOT EXISTS (SELECT 1 FROM combos c WHERE c.id_evento=p.id_conteudo)
  AND NOT EXISTS (SELECT 1 FROM solicitacoes_experiencia e WHERE e.id_experiencia=p.id_conteudo);

DROP TEMPORARY TABLE marketing_copias_equivalentes;
-- Troque por COMMIT apenas na janela controlada em que as equivalências forem aprovadas.
ROLLBACK;
