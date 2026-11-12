import { idString } from '../utils/dto.js';

export const filmFields = ['titulo', 'descricao', 'duracao', 'classificacao', 'data_lancamento', 'diretor', 'trailer', 'disponivel_cinema', 'disponivel_streaming', 'preco_aluguel', 'preco_compra', 'dias_acesso_aluguel', 'status'];
const publicFields = ['id_filme', ...filmFields, 'imagem'];
const writable = [...filmFields, 'url_reproducao'];
export function createCatalogModel(database) {
    const rows = async (c, sql, args) => (await c.execute(sql, args))[0];
    const one = async (c, sql, args) => (await rows(c, sql, args))[0] ?? null;
    const selection = admin => `${[...publicFields, ...(admin ? ['url_reproducao'] : [])].map(k => `f.${k}`).join(',')},
        (SELECT fi.url FROM filmes_imagens fi WHERE fi.id_filme = f.id_filme AND fi.tipo = 'BANNER' AND fi.contexto_banner='GERAL' ORDER BY fi.principal DESC, fi.ordem, fi.id_imagem LIMIT 1) AS banner,
        (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', g.id_genero, 'nome', g.nome)), JSON_ARRAY())
         FROM filme_generos fg JOIN generos g ON g.id_genero = fg.id_genero
         WHERE fg.id_filme = f.id_filme AND g.status = 'ATIVO') AS generos`;
    function pageLimit(limit = 20) { if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new TypeError('Limite inválido'); return limit + 1; }
    function fields(input, allowed) { const keys = Object.keys(input); if (!keys.length || keys.some(k => !allowed.includes(k))) throw new TypeError('Campos inválidos'); return keys; }
    return {
        popularFilms: () => rows(database, `SELECT ${selection(false)}, COUNT(t.id_ticket) AS views
            FROM filmes f JOIN sessoes s ON s.id_filme = f.id_filme
            JOIN itens_pedido ip ON ip.id_sessao = s.id_sessao
            JOIN tickets t ON t.id_item = ip.id_item
            WHERE f.status = 'ATIVO' AND f.disponivel_cinema = 1 AND t.tipo = 'INGRESSO_SESSAO' AND t.status = 'UTILIZADO'
            GROUP BY f.id_filme ORDER BY views DESC, f.id_filme LIMIT 4`, []),
        film: (id, admin = false, c = database, lock = false) => one(c, `SELECT ${selection(admin)} FROM filmes f WHERE f.id_filme = ?${admin ? '' : " AND f.status = 'ATIVO'"}${lock ? ' FOR UPDATE' : ''}`, [id]),
        genre: (id, admin = false, c = database, lock = false) => one(c, `SELECT id_genero,nome,status FROM generos WHERE id_genero = ?${admin ? '' : " AND status = 'ATIVO'"}${lock ? ' FOR UPDATE' : ''}`, [id]),
        listFilms(q, admin = false) {
            const where = ['f.id_filme > ?'], args = [q.cursor ?? '0'];
            if (!admin || q.status) { where.push('f.status = ?'); args.push(admin ? q.status : 'ATIVO'); }
            if (q.titulo) { where.push("f.titulo LIKE ? ESCAPE '!'"); args.push(`%${q.titulo.replace(/[!%_]/g, v => `!${v}`)}%`); }
            if (q.classificacao) { where.push('f.classificacao = ?'); args.push(q.classificacao); }
            if (q.upcoming !== undefined) where.push(q.upcoming ? 'f.data_lancamento > UTC_DATE()' : '(f.data_lancamento IS NULL OR f.data_lancamento <= UTC_DATE())');
            for (const [key, column] of [['cinema', 'disponivel_cinema'], ['streaming', 'disponivel_streaming']]) if (q[key] !== undefined) { where.push(`f.${column} = ?`); args.push(q[key]); }
            if (q.genreId) { where.push(`EXISTS (SELECT 1 FROM filme_generos fg JOIN generos g ON g.id_genero = fg.id_genero WHERE fg.id_filme = f.id_filme AND fg.id_genero = ?${admin ? '' : " AND g.status = 'ATIVO'"})`); args.push(q.genreId); }
            return rows(database, `SELECT ${selection(admin)} FROM filmes f WHERE ${where.join(' AND ')} ORDER BY f.id_filme LIMIT ${pageLimit(q.limit)}`, args);
        },
        listGenres(q, admin = false, filmId = null, c = database) {
            const where = ['g.id_genero > ?'], args = [q.cursor ?? '0'];
            if (q.q) { where.push("g.nome LIKE ? ESCAPE '!'"); args.push(`%${q.q.replace(/[!%_]/g, value => `!${value}`)}%`); }
            if (!admin || q.status) { where.push('g.status = ?'); args.push(admin ? q.status : 'ATIVO'); }
            if (filmId) { where.push('EXISTS (SELECT 1 FROM filme_generos fg WHERE fg.id_genero = g.id_genero AND fg.id_filme = ?)'); args.push(filmId); }
            return rows(c, `SELECT g.id_genero,g.nome,g.status FROM generos g WHERE ${where.join(' AND ')} ORDER BY g.id_genero LIMIT ${pageLimit(q.limit)}`, args);
        },
        async createFilm(c, input) { const keys = fields(input, writable); const [r] = await c.execute(`INSERT INTO filmes (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, keys.map(k => input[k])); return idString(r.insertId); },
        async patchFilm(c, id, input) { const keys = fields(input, writable); await c.execute(`UPDATE filmes SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_filme = ?`, [...keys.map(k => input[k]), id]); },
        async createGenre(c, input) { const [r] = await c.execute('INSERT INTO generos (nome,status) VALUES (?,?)', [input.nome, input.status]); return idString(r.insertId); },
        async patchGenre(c, id, input) { const keys = fields(input, ['nome', 'status']); await c.execute(`UPDATE generos SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_genero = ?`, [...keys.map(k => input[k]), id]); },
        async link(c, filmId, genreId) { await c.execute('INSERT INTO filme_generos (id_filme,id_genero) VALUES (?,?) ON DUPLICATE KEY UPDATE id_filme = ?', [filmId, genreId, filmId]); },
        async unlink(c, filmId, genreId) { await c.execute('DELETE FROM filme_generos WHERE id_filme = ? AND id_genero = ?', [filmId, genreId]); }
    };
}
