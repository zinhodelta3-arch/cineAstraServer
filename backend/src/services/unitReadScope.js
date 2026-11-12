import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

export async function unitReadLocation(c, actor, requestedLocalId, { activeTeam = false } = {}) {
    const userId = idString(actor.id_usuario);
    let sql, args = [userId];
    if (actor.tipo_usuario === 'SUPERVISOR') {
        sql = 'SELECT id_local FROM supervisor_locais WHERE id_supervisor = ?';
        if (requestedLocalId) { sql += ' AND id_local = ?'; args.push(requestedLocalId); }
    } else if (actor.tipo_usuario === 'COLABORADOR') {
        sql = "SELECT DISTINCT sa.id_local FROM equipe_membros m JOIN equipes e ON e.id_equipe=m.id_equipe JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala WHERE m.id_usuario=? AND m.status='ATIVO'";
        if (activeTeam) sql += " AND e.status='ATIVA' AND s.status IN ('AGENDADA','EM_CARTAZ')";
        if (requestedLocalId) { sql += ' AND sa.id_local = ?'; args.push(requestedLocalId); }
        sql += ' ORDER BY sa.id_local';
    } else throw ApiError.acessoNegado();
    const [rows] = await c.execute(`${sql} LIMIT 1`, args);
    if (!rows.length) throw ApiError.acessoNegado();
    return idString(rows[0].id_local);
}
