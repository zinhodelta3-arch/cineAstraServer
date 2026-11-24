import { idString } from '../utils/dto.js';

const teamFields = 'e.id_equipe,e.id_supervisor,e.id_sessao,e.nome,e.status,s.status AS sessao_status,sa.id_local,l.nome AS cinema,s.data,s.horario_inicio,s.horario_fim,sa.status AS room_status,l.status AS location_status';
const teamFrom = 'FROM equipes e JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala JOIN locais l ON l.id_local=sa.id_local';
const supervisorJoin='JOIN usuarios sup ON sup.id_usuario=e.id_supervisor';
const sessionEnd = (alias) => `TIMESTAMP(IF(${alias}.horario_fim<${alias}.horario_inicio, DATE_ADD(${alias}.data, INTERVAL 1 DAY), ${alias}.data), ${alias}.horario_fim)`;
const upcomingEnd = `${sessionEnd('s')} > UTC_TIMESTAMP()`;
const memberFields = 'id_equipe_membro,id_equipe,id_usuario,funcao,data_entrada,status';
const memberProjection=`${memberFields.split(',').map(field=>`m.${field}`).join(',')},u.nome AS member_name`;
const membersFrom='FROM equipe_membros m JOIN usuarios u ON u.id_usuario=m.id_usuario';
const currentCollaboratorLinks=`FROM equipe_membros m JOIN equipes e ON e.id_equipe=m.id_equipe
    JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala
    WHERE m.status='ATIVO' AND e.status='ATIVA' AND s.status IN ('AGENDADA','EM_CARTAZ') AND ${upcomingEnd}`;
const entryFields = 'id_entrada,id_equipe,id_usuario,id_emissor,tipo,funcao_proposta,status,criado_em,decidido_em';
const expiryAt = `LEAST(DATE_ADD(en.criado_em, INTERVAL 7 DAY), ${sessionEnd('s')})`;
const activeLocations = `SELECT rs.id_local FROM equipe_membros em JOIN equipes eq ON eq.id_equipe=em.id_equipe
    JOIN sessoes se ON se.id_sessao=eq.id_sessao JOIN salas rs ON rs.id_sala=se.id_sala
    WHERE em.id_usuario=en.id_usuario AND em.status='ATIVO' AND eq.status='ATIVA'
      AND se.status IN ('AGENDADA','EM_CARTAZ') AND ${sessionEnd('se')}>UTC_TIMESTAMP()`;
const validEntry = `e.status='ATIVA' AND s.status IN ('AGENDADA','EM_CARTAZ') AND sa.status='ATIVA' AND l.status='ATIVO'
    AND ${expiryAt}>UTC_TIMESTAMP()
    AND EXISTS (SELECT 1 FROM usuarios u WHERE u.id_usuario=en.id_usuario AND u.tipo_usuario='COLABORADOR' AND u.status='ATIVO')
    AND EXISTS (SELECT 1 FROM usuarios u JOIN supervisor_locais sl ON sl.id_supervisor=u.id_usuario
        WHERE u.id_usuario=e.id_supervisor AND u.tipo_usuario='SUPERVISOR' AND u.status='ATIVO' AND sl.id_local=l.id_local)
    AND NOT EXISTS (SELECT 1 FROM equipe_membros em WHERE em.id_equipe=e.id_equipe AND em.id_usuario=en.id_usuario AND em.status='ATIVO')
    AND (NOT EXISTS (${activeLocations}) OR EXISTS (${activeLocations} AND rs.id_local=l.id_local))`;
const fromEntries = `FROM equipe_entradas en JOIN equipes e ON e.id_equipe=en.id_equipe
    JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala JOIN locais l ON l.id_local=sa.id_local`;
const visibleStatus = `CASE WHEN en.status='PENDENTE' AND NOT (${validEntry}) THEN 'CANCELADA' ELSE en.status END AS status`;
export function createTeamModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        team: (id,c=database)=>one(c,`SELECT ${teamFields},sup.nome AS supervisor_nome ${teamFrom} ${supervisorJoin} WHERE e.id_equipe=?`,[id]),
        lockTeam: (id, c) => one(c, `SELECT ${teamFields} ${teamFrom} WHERE e.id_equipe = ? FOR UPDATE`, [id]),
        session: (id, c, lock = false) => one(c, `SELECT s.id_sessao,s.status,sa.id_local,s.data,s.horario_inicio,s.horario_fim,
            sa.status AS room_status,l.status AS location_status FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala
            JOIN locais l ON l.id_local=sa.id_local WHERE s.id_sessao=?${lock?' FOR UPDATE':''}`, [id]),
        supervisorLocation: (id, c = database, lock = false) => one(c, `SELECT id_local FROM supervisor_locais WHERE id_supervisor = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        actorLocations(actor) {
            if (actor.tipo === 'SUPERVISOR') return rows(database, 'SELECT l.id_local,l.nome FROM supervisor_locais sl JOIN locais l ON l.id_local = sl.id_local WHERE sl.id_supervisor = ?', [actor.id]);
            return rows(database, "SELECT DISTINCT l.id_local,l.nome FROM equipe_membros m JOIN equipes e ON e.id_equipe = m.id_equipe JOIN sessoes s ON s.id_sessao = e.id_sessao JOIN salas sa ON sa.id_sala = s.id_sala JOIN locais l ON l.id_local = sa.id_local WHERE m.id_usuario = ? AND m.status = 'ATIVO' ORDER BY l.nome", [actor.id]);
        },
        collaboratorByEmail: (email,c=database) => one(c, "SELECT id_usuario,nome FROM usuarios WHERE email_normalizado = ? AND tipo_usuario = 'COLABORADOR' AND status = 'ATIVO'", [email]),
        activeTeamForSession: (id, c) => one(c, "SELECT id_equipe FROM equipes WHERE id_sessao = ? AND status = 'ATIVA' LIMIT 1", [id]),
        user: (id, c, lock = false) => one(c, `SELECT id_usuario,tipo_usuario,status FROM usuarios WHERE id_usuario = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        listTeams(actor, q) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const where = ['e.id_equipe > ?'], args = [q.cursor ?? '0'];
            if (actor.tipo === 'SUPERVISOR') { where.push('EXISTS (SELECT 1 FROM supervisor_locais sl WHERE sl.id_supervisor = ? AND sl.id_local = sa.id_local)'); args.push(actor.id); }
            else if (actor.tipo === 'COLABORADOR') {
                where.push(`(EXISTS (SELECT 1 FROM equipe_membros m WHERE m.id_equipe=e.id_equipe AND m.id_usuario=? AND m.status='ATIVO')
                    OR EXISTS (SELECT 1 FROM equipe_entradas en WHERE en.id_equipe=e.id_equipe AND en.id_usuario=?
                        AND en.tipo='CONVITE' AND en.status='PENDENTE' AND ${validEntry}))`);
                args.push(actor.id, actor.id);
            }
            const ownFunction = actor.tipo === 'COLABORADOR' ? ", (SELECT m.funcao FROM equipe_membros m WHERE m.id_equipe=e.id_equipe AND m.id_usuario=? AND m.status='ATIVO' LIMIT 1) AS minha_funcao" : '';
            if (ownFunction) args.unshift(actor.id);
            return rows(database,`SELECT ${teamFields},sup.nome AS supervisor_nome${ownFunction} ${teamFrom} ${supervisorJoin}
                WHERE ${where.join(' AND ')} ORDER BY e.id_equipe LIMIT ${q.limit+1}`,args);
        },
        async create(c, data) { const [r] = await c.execute("INSERT INTO equipes (id_supervisor,id_sessao,nome,status) VALUES (?,?,?,'ATIVA')", [data.supervisorId, data.sessionId, data.nome]); return idString(r.insertId); },
        update(c, id, input) { const keys = Object.keys(input); if (!keys.length || keys.some(k => !['nome','status','id_supervisor'].includes(k))) throw new TypeError('Campos inválidos'); return c.execute(`UPDATE equipes SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_equipe = ?`, [...keys.map(k => input[k]), id]); },
        member: (teamId, memberId, c = database) => one(c, `SELECT ${memberProjection} ${membersFrom} WHERE m.id_equipe=? AND m.id_equipe_membro=?`,[teamId,memberId]),
        memberByUser: (teamId, userId, c = database) => one(c, `SELECT ${memberFields} FROM equipe_membros WHERE id_equipe = ? AND id_usuario = ?`, [teamId, userId]),
        activeMemberInLocal: (userId, localId, c) => one(c, `SELECT m.id_equipe_membro FROM equipe_membros m JOIN equipes e ON e.id_equipe=m.id_equipe JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala WHERE m.id_usuario=? AND m.status='ATIVO' AND e.status='ATIVA' AND s.status IN ('AGENDADA','EM_CARTAZ') AND ${upcomingEnd} AND sa.id_local=? LIMIT 1 FOR UPDATE`, [userId, localId]),
        activeMembership: (userId, c) => one(c, `SELECT m.id_equipe_membro FROM equipe_membros m
            JOIN equipes e ON e.id_equipe = m.id_equipe JOIN sessoes s ON s.id_sessao = e.id_sessao
            WHERE m.id_usuario = ? AND m.status = 'ATIVO' AND e.status = 'ATIVA' AND s.status IN ('AGENDADA','EM_CARTAZ') AND ${upcomingEnd} LIMIT 1 FOR UPDATE`, [userId]),
        availableTeams: (userId, q, c) => rows(c, `WITH active_locations AS (
            SELECT DISTINCT sa.id_local FROM equipe_membros m
            JOIN equipes e ON e.id_equipe=m.id_equipe JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala
            WHERE m.id_usuario=? AND m.status='ATIVO' AND e.status='ATIVA' AND s.status IN ('AGENDADA','EM_CARTAZ') AND ${upcomingEnd}
        )
        SELECT e.id_equipe,e.nome,l.nome AS cinema,s.data,s.horario_inicio,s.horario_fim
            ${teamFrom} JOIN supervisor_locais sl ON sl.id_supervisor = e.id_supervisor AND sl.id_local = l.id_local
            JOIN usuarios u ON u.id_usuario = e.id_supervisor AND u.status = 'ATIVO' AND u.tipo_usuario = 'SUPERVISOR'
            WHERE e.id_equipe>? AND e.status='ATIVA' AND s.status IN ('AGENDADA','EM_CARTAZ') AND l.status='ATIVO' AND sa.status='ATIVA' AND ${upcomingEnd}
            AND (NOT EXISTS (SELECT 1 FROM active_locations) OR sa.id_local IN (SELECT id_local FROM active_locations))
            AND NOT EXISTS (SELECT 1 FROM equipe_membros m WHERE m.id_equipe=e.id_equipe AND m.id_usuario=? AND m.status='ATIVO')
            AND NOT EXISTS (SELECT 1 FROM equipe_entradas en WHERE en.id_equipe=e.id_equipe AND en.id_usuario=? AND en.status='PENDENTE' AND ${expiryAt}>UTC_TIMESTAMP())
            ORDER BY e.id_equipe LIMIT ?`, [userId,q.cursor??'0',userId,userId,q.limit+1]),
        ownInvitations: (userId,q)=>rows(database,`SELECT en.id_entrada,en.id_equipe,${visibleStatus},en.funcao_proposta,en.criado_em,en.decidido_em,${expiryAt} AS expiresAt,
            e.nome,l.nome AS cinema,s.data,s.horario_inicio,s.horario_fim
            ${teamFrom} JOIN equipe_entradas en ON en.id_equipe=e.id_equipe
            WHERE en.id_usuario=? AND en.tipo='CONVITE' ${q.cursor?'AND en.id_entrada<?':''} ${q.entryId?'AND en.id_entrada=?':''}
            ORDER BY en.id_entrada DESC LIMIT ?`,[userId,...(q.cursor?[q.cursor]:[]),...(q.entryId?[q.entryId]:[]),q.limit+1]),
        eligibleSessions: (supervisorId,q) => rows(database,`SELECT s.id_sessao,s.data,s.horario_inicio,s.horario_fim,
            f.titulo AS titulo_filme,sa.nome AS nome_sala
            FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala JOIN filmes f ON f.id_filme=s.id_filme
            JOIN locais l ON l.id_local=sa.id_local JOIN supervisor_locais sl ON sl.id_local=l.id_local
            WHERE sl.id_supervisor=? AND s.id_sessao>? AND l.status='ATIVO' AND sa.status='ATIVA'
            AND s.status IN ('AGENDADA','EM_CARTAZ') AND ${upcomingEnd}
            AND NOT EXISTS (SELECT 1 FROM equipes e WHERE e.id_sessao=s.id_sessao AND e.status='ATIVA')
            ORDER BY s.id_sessao LIMIT ?`,[supervisorId,q.cursor??'0',q.limit+1]),
        ownRequests: (userId, q, c = database) => rows(c, `SELECT en.id_entrada,en.id_equipe,${visibleStatus},en.criado_em,en.decidido_em,e.nome,
            en.funcao_proposta,${expiryAt} AS expiresAt ${fromEntries}
            WHERE en.id_usuario = ? AND en.tipo = 'SOLICITACAO' AND en.id_entrada > ? ${q.entryId?'AND en.id_entrada=?':''}
            ORDER BY en.id_entrada LIMIT ?`, [userId, q.cursor ?? '0', ...(q.entryId?[q.entryId]:[]), q.limit + 1]),
        listMembers(teamId,q) {
            if(!Number.isInteger(q.limit)||q.limit<1||q.limit>100)throw new TypeError('Limite inválido');
            return rows(database,`SELECT ${memberProjection} ${membersFrom} WHERE m.id_equipe=? AND m.id_equipe_membro>?
                ORDER BY m.id_equipe_membro LIMIT ?`,[teamId,q.cursor??'0',q.limit+1]);
        },
        localCollaborators(c,localId,q){
            const search=q.q?`%${q.q.replace(/[!%_]/g,char=>`!${char}`)}%`:null;
            return rows(c,`SELECT u.id_usuario,u.nome,u.email,u.telefone,u.status FROM usuarios u
                WHERE u.tipo_usuario='COLABORADOR' AND u.status='ATIVO' AND u.id_usuario>?
                AND EXISTS (SELECT 1 ${currentCollaboratorLinks} AND m.id_usuario=u.id_usuario AND sa.id_local=?)
                ${search?"AND u.nome LIKE ? ESCAPE '!'":''} ORDER BY u.id_usuario LIMIT ?`,
            [q.cursor??'0',localId,...(search?[search]:[]),q.limit+1]);
        },
        hasOtherLocation:(c,userId,localId)=>one(c,`SELECT m.id_equipe_membro ${currentCollaboratorLinks}
            AND m.id_usuario=? AND sa.id_local<>? LIMIT 1 FOR UPDATE`,[userId,localId]),
        deactivateLocalMemberships:(c,userId,localId)=>c.execute(`UPDATE equipe_membros m
            JOIN equipes e ON e.id_equipe=m.id_equipe JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala
            SET m.status='INATIVO' WHERE m.id_usuario=? AND sa.id_local=? AND m.status='ATIVO' AND e.status='ATIVA'
            AND s.status IN ('AGENDADA','EM_CARTAZ') AND ${upcomingEnd}`,[userId,localId]),
        cancelUserEntries:(c,userId)=>c.execute("UPDATE equipe_entradas SET status='CANCELADA',decidido_em=UTC_TIMESTAMP() WHERE id_usuario=? AND status='PENDENTE'",[userId]),
        async activateMember(c, teamId, userId, functionName, previous) {
            if (previous) { await c.execute("UPDATE equipe_membros SET status = 'ATIVO',funcao = ?,data_entrada = CURRENT_DATE WHERE id_equipe = ? AND id_usuario = ?", [functionName, teamId, userId]); return idString(previous.id_equipe_membro); }
            const [r] = await c.execute("INSERT INTO equipe_membros (id_equipe,id_usuario,funcao,status) VALUES (?,?,?,'ATIVO')", [teamId, userId, functionName]); return idString(r.insertId);
        },
        updateMember(c, teamId, id, data) { const keys = Object.keys(data); if (!keys.length || keys.some(k => !['funcao','status'].includes(k))) throw new TypeError('Campos inválidos'); return c.execute(`UPDATE equipe_membros SET ${keys.map(k => `${k} = ?`).join(',')} WHERE id_equipe = ? AND id_equipe_membro = ?`, [...keys.map(k => data[k]), teamId, id]); },
        entry: (teamId, id, c = database, lock = false) => one(c, `SELECT ${entryFields} FROM equipe_entradas WHERE id_equipe = ? AND id_entrada = ?${lock ? ' FOR UPDATE' : ''}`, [teamId, id]),
        pendingEntry: (teamId, userId, c = database) => one(c, `SELECT ${entryFields} FROM equipe_entradas WHERE id_equipe = ? AND id_usuario = ? AND status = 'PENDENTE' LIMIT 1`, [teamId, userId]),
        visibleInvitation:(teamId,userId)=>one(database,`SELECT en.id_entrada ${fromEntries}
            WHERE en.id_equipe=? AND en.id_usuario=? AND en.tipo='CONVITE' AND en.status='PENDENTE' AND ${validEntry} LIMIT 1`,[teamId,userId]),
        listEntries(teamId,q,userId=null){
            if(!Number.isInteger(q.limit)||q.limit<1||q.limit>100)throw new TypeError('Limite inválido');
            return rows(database,`SELECT en.id_entrada,en.id_equipe,en.id_usuario,en.id_emissor,en.tipo,en.funcao_proposta,
                ${visibleStatus},en.criado_em,en.decidido_em,${expiryAt} AS expiresAt ${fromEntries}
                WHERE en.id_equipe=? AND en.id_entrada > ?${userId?' AND en.id_usuario = ?':''}${q.entryId?' AND en.id_entrada=?':''}
                ORDER BY en.id_entrada LIMIT ${q.limit+1}`,[teamId,q.cursor??'0',...(userId?[userId]:[]),...(q.entryId?[q.entryId]:[])]);
        },
        async createEntry(c, data) { const [r] = await c.execute("INSERT INTO equipe_entradas (id_equipe,id_usuario,id_emissor,tipo,funcao_proposta,status,criado_em) VALUES (?,?,?,?,?,'PENDENTE',UTC_TIMESTAMP())", [data.teamId, data.userId, data.actorId, data.type, data.functionName ?? null]); return idString(r.insertId); },
        updateEntryFunction:(c,teamId,entryId,funcao)=>c.execute("UPDATE equipe_entradas SET funcao_proposta=? WHERE id_equipe=? AND id_entrada=? AND status='PENDENTE'",[funcao,teamId,entryId]),
        invalidEntries:(limit)=>rows(database,`SELECT en.id_entrada,en.id_equipe ${fromEntries}
            WHERE en.status='PENDENTE' AND NOT (${validEntry}) ORDER BY en.id_entrada LIMIT ?`,[limit]),
        decideEntry: (c, teamId, id, status) => c.execute('UPDATE equipe_entradas SET status = ?,decidido_em = UTC_TIMESTAMP() WHERE id_equipe = ? AND id_entrada = ?', [status, teamId, id]),
        cancelPending: (c, teamId) => c.execute("UPDATE equipe_entradas SET status = 'CANCELADA',decidido_em = UTC_TIMESTAMP() WHERE id_equipe = ? AND status = 'PENDENTE'", [teamId])
    };
}
