import { idString } from '../utils/dto.js';

const projection = 's.id_sessao,s.id_filme,s.id_sala,sa.id_local,f.titulo AS titulo_filme,sa.nome AS nome_sala,l.nome AS nome_local,s.data,s.horario_inicio,s.horario_fim,s.idioma,s.preco_inteira,s.status';
const joins = ' FROM sessoes s JOIN salas sa ON sa.id_sala = s.id_sala JOIN locais l ON l.id_local = sa.id_local JOIN filmes f ON f.id_filme = s.id_filme';
const publicConditions = "s.status IN ('AGENDADA','EM_CARTAZ') AND sa.status = 'ATIVA' AND l.status = 'ATIVO' AND f.status = 'ATIVO' AND f.disponivel_cinema = TRUE";
const future = 'TIMESTAMP(s.data,s.horario_inicio) > UTC_TIMESTAMP(3)';
const activeSeat = "a.id_sala=s.id_sala AND a.status='ATIVA'";
const liveOccupancy = "(o.estado='CONFIRMADA' OR (o.estado='RESERVADA' AND o.expira_em>UTC_TIMESTAMP(3)))";
const seats = `(SELECT COUNT(*) FROM assentos a WHERE ${activeSeat})`;
const occupied = `(SELECT COUNT(*) FROM assento_ocupacoes o JOIN assentos a ON a.id_assento=o.id_assento
    WHERE o.id_sessao=s.id_sessao AND ${activeSeat} AND ${liveOccupancy})`;
const availability = `${seats} AS assentos_ativos,${seats}-${occupied} AS assentos_disponiveis`;
export function createSessionModel(database) {
    const rows = async (c, sql, args = []) => (await c.execute(sql, args))[0];
    const one = async (c, sql, args = []) => (await rows(c, sql, args))[0] ?? null;
    return {
        supervisorLocation: (id, c = database) => one(c, 'SELECT id_local FROM supervisor_locais WHERE id_supervisor = ?', [id]),
        filmAvailability: filmId => rows(database, `WITH upcoming AS (
            SELECT sa.id_local,l.nome,sa.tipo,s.data,s.horario_inicio,${availability},
                (SELECT COUNT(*) FROM assento_ocupacoes o WHERE o.id_sessao=s.id_sessao AND o.estado='CONFIRMADA') AS sold
            ${joins} WHERE s.id_filme=? AND ${publicConditions} AND ${future}
        )
        SELECT id_local,nome,COUNT(*) AS session_count,
            SUM(assentos_disponiveis>0) AS open_sessions,SUM(sold) AS sold,
            MIN(CASE WHEN assentos_disponiveis>0 THEN CONCAT(data,'T',horario_inicio) END) AS next_open,
            GROUP_CONCAT(DISTINCT tipo ORDER BY tipo SEPARATOR ' · ') AS formats
        FROM upcoming GROUP BY id_local,nome ORDER BY sold DESC,id_local`, [filmId]),
        availableDays: (filmId, localId) => rows(database, `SELECT DISTINCT s.data AS date${joins}
            WHERE s.id_filme = ? AND sa.id_local = ? AND s.status IN ('AGENDADA','EM_CARTAZ')
            AND sa.status = 'ATIVA' AND l.status = 'ATIVO' AND f.status = 'ATIVO'
            AND f.disponivel_cinema = TRUE AND TIMESTAMP(s.data,s.horario_inicio) > UTC_TIMESTAMP()
            ORDER BY s.data`, [filmId, localId]),
        upcomingForFilm(filmId, { date, localId }) {
            const filters = ['s.id_filme = ?', publicConditions, 'TIMESTAMP(s.data,s.horario_inicio) > UTC_TIMESTAMP()'];
            const args = [filmId];
            if (date) { filters.push('s.data = ?'); args.push(date); }
            if (localId) { filters.push('sa.id_local = ?'); args.push(localId); }
            return rows(database, `SELECT ${projection}${joins} WHERE ${filters.join(' AND ')}
                ORDER BY s.data, s.horario_inicio, s.id_sessao LIMIT 7`, args);
        },
        // One statement keeps session visibility, seat map and occupancy in the same read snapshot.
        seatAvailability: id => rows(database, `SELECT s.id_sessao,s.id_sala,sa.id_local,
            a.id_assento,a.fileira,a.numero,a.tipo,
            CASE WHEN a.status IS NULL OR a.status<>'ATIVA' THEN 'INDISPONIVEL'
                 WHEN o.estado='CONFIRMADA' THEN 'VENDIDO'
                 WHEN o.estado='RESERVADA' AND o.expira_em>UTC_TIMESTAMP(3) THEN 'RESERVADO'
                 ELSE 'DISPONIVEL' END AS disponibilidade
            ${joins}
            LEFT JOIN assentos a ON a.id_sala=s.id_sala
            LEFT JOIN assento_ocupacoes o ON o.id_sessao=s.id_sessao AND o.id_assento=a.id_assento
            WHERE s.id_sessao=? AND s.status IN ('AGENDADA','EM_CARTAZ')
                AND sa.status='ATIVA' AND l.status='ATIVO' AND f.status='ATIVO' AND f.disponivel_cinema=TRUE
            ORDER BY a.fileira,a.numero,a.id_assento`, [id]),
        session: (id, c = database) => one(c, `SELECT ${projection}${joins} WHERE s.id_sessao = ?`, [id]),
        sessionForUpdate: (id, c) => one(c, 'SELECT id_sessao,id_filme,id_sala,data,horario_inicio,horario_fim,idioma,preco_inteira,status FROM sessoes WHERE id_sessao = ? FOR UPDATE', [id]),
        room: (id, c = database, lock = false) => lock
            ? one(c, 'SELECT id_sala,id_local,status AS sala_status,capacidade FROM salas WHERE id_sala = ? FOR UPDATE', [id])
            : one(c, 'SELECT sa.id_sala,sa.id_local,sa.status AS sala_status,sa.capacidade,l.status AS local_status FROM salas sa JOIN locais l ON l.id_local = sa.id_local WHERE sa.id_sala = ?', [id]),
        local: (id, c, lock = true) => one(c, `SELECT id_local,status FROM locais WHERE id_local = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        film: (id, c, lock = true) => one(c, `SELECT id_filme,status,disponivel_cinema,duracao FROM filmes WHERE id_filme = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        activeSeats: (roomId, c) => one(c, "SELECT COUNT(*) AS total FROM assentos WHERE id_sala = ? AND status = 'ATIVA'", [roomId]),
        hasItems: (id, c) => one(c, 'SELECT id_item FROM itens_pedido WHERE id_sessao = ? LIMIT 1', [id]),
        overlapCandidates(localId, startDate, endDate, excludeId, c) {
            return rows(c, `SELECT s.id_sessao,s.data,s.horario_inicio,s.horario_fim FROM sessoes s JOIN salas sa ON sa.id_sala = s.id_sala WHERE sa.id_local = ? AND s.data BETWEEN ? AND ? AND s.status <> 'CANCELADA'${excludeId ? ' AND s.id_sessao <> ?' : ''} ORDER BY s.data,s.horario_inicio,s.id_sessao`, [localId, startDate, endDate, ...(excludeId ? [excludeId] : [])]);
        },
        list(q, admin = false, c = database) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['s.id_sessao > ?'], args = [q.cursor ?? '0'];
            if (q.localId) { where.push('sa.id_local = ?'); args.push(q.localId); }
            if (!admin && q.filmId) { where.push('s.id_filme = ?',future); args.push(q.filmId); }
            if (q.date) { where.push('s.data = ?'); args.push(q.date); }
            if (q.startFrom) { where.push('s.horario_inicio >= ?'); args.push(q.startFrom); }
            if (q.startUntil) { where.push('s.horario_inicio <= ?'); args.push(q.startUntil); }
            if (admin) { if (q.status) { where.push('s.status = ?'); args.push(q.status); } }
            else where.push(publicConditions);
            const extra = !admin && q.filmId ? `,${availability}` : '';
            return rows(c, `SELECT ${projection}${extra}${joins} WHERE ${where.join(' AND ')} ORDER BY s.id_sessao LIMIT ${q.limit + 1}`, args);
        },
        publicSession: id => one(database, `SELECT ${projection}${joins} WHERE s.id_sessao = ? AND s.status IN ('AGENDADA','EM_CARTAZ') AND sa.status = 'ATIVA' AND l.status = 'ATIVO' AND f.status = 'ATIVO' AND f.disponivel_cinema = TRUE`, [id]),
        async insert(c, data) {
            const keys = ['id_filme','id_sala','data','horario_inicio','horario_fim','idioma','preco_inteira','status'];
            const [result] = await c.execute(`INSERT INTO sessoes (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, keys.map(k => data[k]));
            return idString(result.insertId);
        },
        update(c, id, data) {
            const allowed = ['id_filme','data','horario_inicio','horario_fim','idioma','preco_inteira','status'];
            const keys = Object.keys(data);
            if (!keys.length || keys.some(k => !allowed.includes(k))) throw new TypeError('Campos inválidos');
            return c.execute(`UPDATE sessoes SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_sessao = ?`, [...keys.map(k => data[k]), id]);
        }
    };
}
