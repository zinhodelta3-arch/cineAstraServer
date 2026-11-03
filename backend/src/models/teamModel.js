import { idString } from '../utils/dto.js';

const teamFields = 'e.id_equipe,e.id_supervisor,e.id_sessao,e.nome,e.status,s.status AS sessao_status,sa.id_local';
const memberFields = 'id_equipe_membro,id_equipe,id_usuario,funcao,data_entrada,status';
const entryFields = 'id_entrada,id_equipe,id_usuario,id_emissor,tipo,funcao_proposta,status,criado_em,decidido_em';
export function createTeamModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        team: (id, c = database) => one(c, `SELECT ${teamFields} FROM equipes e JOIN sessoes s ON s.id_sessao = e.id_sessao JOIN salas sa ON sa.id_sala = s.id_sala WHERE e.id_equipe = ?`, [id]),
        lockTeam: (id, c) => one(c, `SELECT ${teamFields} FROM equipes e JOIN sessoes s ON s.id_sessao = e.id_sessao JOIN salas sa ON sa.id_sala = s.id_sala WHERE e.id_equipe = ? FOR UPDATE`, [id]),
        session: (id, c, lock = false) => one(c, `SELECT s.id_sessao,s.status,sa.id_local FROM sessoes s JOIN salas sa ON sa.id_sala = s.id_sala WHERE s.id_sessao = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        supervisorLocation: (id, c = database, lock = false) => one(c, `SELECT id_local FROM supervisor_locais WHERE id_supervisor = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        actorLocations(actor) {
            if (actor.tipo === 'SUPERVISOR') return rows(database, 'SELECT l.id_local,l.nome FROM supervisor_locais sl JOIN locais l ON l.id_local = sl.id_local WHERE sl.id_supervisor = ?', [actor.id]);
            return rows(database, "SELECT DISTINCT l.id_local,l.nome FROM equipe_membros m JOIN equipes e ON e.id_equipe = m.id_equipe JOIN sessoes s ON s.id_sessao = e.id_sessao JOIN salas sa ON sa.id_sala = s.id_sala JOIN locais l ON l.id_local = sa.id_local WHERE m.id_usuario = ? AND m.status = 'ATIVO' ORDER BY l.nome", [actor.id]);
        },
        collaboratorByEmail: email => one(database, "SELECT id_usuario,nome FROM usuarios WHERE email_normalizado = ? AND tipo_usuario = 'COLABORADOR' AND status = 'ATIVO'", [email]),
        activeTeamForSession: (id, c) => one(c, "SELECT id_equipe FROM equipes WHERE id_sessao = ? AND status = 'ATIVA' LIMIT 1", [id]),
        user: (id, c, lock = false) => one(c, `SELECT id_usuario,tipo_usuario,status FROM usuarios WHERE id_usuario = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        listTeams(actor, q) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['e.id_equipe > ?'], args = [q.cursor ?? '0'];
            if (actor.tipo === 'SUPERVISOR') { where.push('EXISTS (SELECT 1 FROM supervisor_locais sl WHERE sl.id_supervisor = ? AND sl.id_local = sa.id_local)'); args.push(actor.id); }
            else if (actor.tipo === 'COLABORADOR') {
                where.push("(EXISTS (SELECT 1 FROM equipe_membros m WHERE m.id_equipe = e.id_equipe AND m.id_usuario = ? AND m.status = 'ATIVO') OR EXISTS (SELECT 1 FROM equipe_entradas en WHERE en.id_equipe = e.id_equipe AND en.id_usuario = ? AND en.tipo = 'CONVITE' AND en.status = 'PENDENTE'))");
                args.push(actor.id, actor.id);
            }
            return rows(database, `SELECT ${teamFields} FROM equipes e JOIN sessoes s ON s.id_sessao = e.id_sessao JOIN salas sa ON sa.id_sala = s.id_sala WHERE ${where.join(' AND ')} ORDER BY e.id_equipe LIMIT ${q.limit + 1}`, args);
        },
        async create(c, data) { const [r] = await c.execute("INSERT INTO equipes (id_supervisor,id_sessao,nome,status) VALUES (?,?,?,'ATIVA')", [data.supervisorId, data.sessionId, data.nome]); return idString(r.insertId); },
        update(c, id, input) { const keys = Object.keys(input); if (!keys.length || keys.some(k => !['nome','status','id_supervisor'].includes(k))) throw new TypeError('Campos inválidos'); return c.execute(`UPDATE equipes SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_equipe = ?`, [...keys.map(k => input[k]), id]); },
        member: (teamId, memberId, c = database) => one(c, `SELECT ${memberFields} FROM equipe_membros WHERE id_equipe = ? AND id_equipe_membro = ?`, [teamId, memberId]),
        memberByUser: (teamId, userId, c = database) => one(c, `SELECT ${memberFields} FROM equipe_membros WHERE id_equipe = ? AND id_usuario = ?`, [teamId, userId]),
        activeMemberInLocal: (userId, localId, c = database) => one(c, "SELECT m.id_equipe_membro FROM equipe_membros m JOIN equipes e ON e.id_equipe = m.id_equipe JOIN sessoes s ON s.id_sessao = e.id_sessao JOIN salas sa ON sa.id_sala = s.id_sala WHERE m.id_usuario = ? AND m.status = 'ATIVO' AND e.status = 'ATIVA' AND sa.id_local = ? LIMIT 1", [userId, localId]),
        listMembers(teamId, q) { if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido'); return rows(database, `SELECT ${memberFields} FROM equipe_membros WHERE id_equipe = ? AND id_equipe_membro > ? ORDER BY id_equipe_membro LIMIT ${q.limit + 1}`, [teamId, q.cursor ?? '0']); },
        async activateMember(c, teamId, userId, functionName, previous) {
            if (previous) { await c.execute("UPDATE equipe_membros SET status = 'ATIVO',funcao = ?,data_entrada = CURRENT_DATE WHERE id_equipe = ? AND id_usuario = ?", [functionName, teamId, userId]); return idString(previous.id_equipe_membro); }
            const [r] = await c.execute("INSERT INTO equipe_membros (id_equipe,id_usuario,funcao,status) VALUES (?,?,?,'ATIVO')", [teamId, userId, functionName]); return idString(r.insertId);
        },
        updateMember(c, teamId, id, data) { const keys = Object.keys(data); if (!keys.length || keys.some(k => !['funcao','status'].includes(k))) throw new TypeError('Campos inválidos'); return c.execute(`UPDATE equipe_membros SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_equipe = ? AND id_equipe_membro = ?`, [...keys.map(k => data[k]), teamId, id]); },
        entry: (teamId, id, c = database, lock = false) => one(c, `SELECT ${entryFields} FROM equipe_entradas WHERE id_equipe = ? AND id_entrada = ?${lock ? ' FOR UPDATE' : ''}`, [teamId, id]),
        pendingEntry: (teamId, userId, c = database) => one(c, `SELECT ${entryFields} FROM equipe_entradas WHERE id_equipe = ? AND id_usuario = ? AND status = 'PENDENTE' LIMIT 1`, [teamId, userId]),
        listEntries(teamId, q, userId = null) { if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido'); return rows(database, `SELECT ${entryFields} FROM equipe_entradas WHERE id_equipe = ? AND id_entrada > ?${userId ? ' AND id_usuario = ?' : ''} ORDER BY id_entrada LIMIT ${q.limit + 1}`, [teamId, q.cursor ?? '0', ...(userId ? [userId] : [])]); },
        async createEntry(c, data) { const [r] = await c.execute("INSERT INTO equipe_entradas (id_equipe,id_usuario,id_emissor,tipo,funcao_proposta,status) VALUES (?,?,?,?,?,'PENDENTE')", [data.teamId, data.userId, data.actorId, data.type, data.functionName ?? null]); return idString(r.insertId); },
        decideEntry: (c, teamId, id, status) => c.execute('UPDATE equipe_entradas SET status = ?,decidido_em = UTC_TIMESTAMP() WHERE id_equipe = ? AND id_entrada = ?', [status, teamId, id]),
        cancelPending: (c, teamId) => c.execute("UPDATE equipe_entradas SET status = 'CANCELADA',decidido_em = UTC_TIMESTAMP() WHERE id_equipe = ? AND status = 'PENDENTE'", [teamId])
    };
}
