import { idString } from '../utils/dto.js';
import { readableSlug } from '../utils/catalogSlug.js';

const locationSlug = `COALESCE(slug,${readableSlug('nome','id_local','cinema')})`;
const columns = {
    local: `id_local,nome,cep,logradouro,numero,complemento,bairro,cidade,estado,telefone,status,tipo_local,lotacao_eventos,acesso_eventos,imagem_url,${locationSlug} AS slug`,
    room: 'id_sala,id_local,nome,capacidade,tipo,status',
    seat: 'id_assento,id_sala,fileira,numero,tipo,status,posicao_visual'
};
const table = { local: 'locais', room: 'salas', seat: 'assentos' };
const pk = { local: 'id_local', room: 'id_sala', seat: 'id_assento' };
const parent = { room: 'id_local', seat: 'id_sala' };
const writable = { local: ['nome', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'telefone', 'status','tipo_local','lotacao_eventos','acesso_eventos','imagem_url'],
    room: ['nome', 'capacidade', 'tipo', 'status'], seat: ['fileira', 'numero', 'tipo', 'status','posicao_visual'] };
export function createVenueModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        supervisorLocation: (id, c = database) => one(c, 'SELECT id_local FROM supervisor_locais WHERE id_supervisor = ?', [id]),
        local: (id, c = database, lock = false) => one(c, `SELECT ${columns.local} FROM locais WHERE ${/^\d+$/.test(id) ? 'id_local' : locationSlug} = ?${lock ? ' FOR UPDATE' : ''}`, [id]),
        room: (localId, id, c = database, lock = false) => one(c, `SELECT ${columns.room} FROM salas WHERE id_local = ? AND id_sala = ?${lock ? ' FOR UPDATE' : ''}`, [localId, id]),
        seat: (roomId, id, c = database, lock = false) => one(c, `SELECT ${columns.seat} FROM assentos WHERE id_sala = ? AND id_assento = ?${lock ? ' FOR UPDATE' : ''}`, [roomId, id]),
        list(kind, parentId, q, admin = false, c = database) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const filters = [`${pk[kind]} > ?`], args = [q.cursor ?? '0'];
            if (parentId) { filters.push(`${parent[kind]} = ?`); args.push(parentId); }
            if (!admin || q.status) { filters.push('status = ?'); args.push(q.status ?? (kind === 'local' ? 'ATIVO' : 'ATIVA')); }
            if (kind === 'local' && q.cinema) {
                filters.push("EXISTS (SELECT 1 FROM salas WHERE salas.id_local=locais.id_local AND salas.status='ATIVA')");
            }
            if (kind === 'local' && q.name) { filters.push("nome LIKE ? ESCAPE '!'"); args.push(`%${q.name.replace(/[!%_]/g, value => `!${value}`)}%`); }
            if (kind === 'local' && q.q) for (const word of q.q.split(/\s+/).slice(0,12)) {
                filters.push("LOCATE(?, CONCAT_WS(' ', nome, logradouro, bairro, cidade, estado, cep))>0"); args.push(word);
            }
            if (kind === 'seat' && q.accessible !== undefined) { filters.push(`tipo ${q.accessible ? 'IN' : 'NOT IN'} ('PCD','OBESO','IDOSO')`); }
            return rows(c, `SELECT ${columns[kind]} FROM ${table[kind]} WHERE ${filters.join(' AND ')} ORDER BY ${pk[kind]} LIMIT ${q.limit + 1}`, args);
        },
        async insert(kind, c, parentId, input) {
            const keys = [...(parentId ? [parent[kind]] : []), ...Object.keys(input)];
            if (Object.keys(input).some(k => !writable[kind].includes(k))) throw new TypeError('Campo inválido');
            const [result] = await c.execute(`INSERT INTO ${table[kind]} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, [...(parentId ? [parentId] : []), ...Object.values(input)]);
            return idString(result.insertId);
        },
        async update(kind, c, id, input) {
            const keys = Object.keys(input);
            if (!keys.length || keys.some(k => !writable[kind].includes(k))) throw new TypeError('Campo inválido');
            const freeze = kind === 'local' && keys.includes('nome') ? `slug = ${locationSlug}, ` : '';
            await c.execute(`UPDATE ${table[kind]} SET ${freeze}${keys.map(k => `${k} = ?`).join(',')} WHERE ${pk[kind]} = ?`, [...keys.map(k => input[k]), id]);
        },
        seatLayout:(c,roomId,lock=false)=>rows(c,`SELECT ${columns.seat} FROM assentos WHERE id_sala=? ORDER BY fileira,posicao_mapa,id_assento${lock?' FOR UPDATE':''}`,[roomId]),
        roomScene: (c, roomId) => one(c ?? database, 'SELECT cena_3d FROM salas WHERE id_sala=?', [roomId]),
        saveRoomScene: (c, roomId, scene) => c.execute('UPDATE salas SET cena_3d=? WHERE id_sala=?', [JSON.stringify(scene), roomId]),
        async insertSeats(c,roomId,seats){
            await c.execute(`INSERT INTO assentos(id_sala,fileira,numero,tipo,status,posicao_visual) VALUES ${seats.map(()=>'(?,?,?,?,?,?)').join(',')}`,
                seats.flatMap(seat=>[roomId,seat.fileira,seat.numero,seat.tipo,seat.status,seat.posicao_visual??null]));
        },
        moveSeats(c,roomId,moves) {
            const cases=moves.map(()=> 'WHEN ? THEN ?').join(' ');
            return c.execute(`UPDATE assentos SET posicao_visual=CASE id_assento ${cases} END
                WHERE id_sala=? AND id_assento IN (${moves.map(()=>'?').join(',')})`,
                [...moves.flatMap(move=>[move.seatId,move.position]),roomId,...moves.map(move=>move.seatId)]);
        },
        activeSeats: (c, roomId) => one(c, "SELECT COUNT(*) AS total FROM assentos WHERE id_sala = ? AND status = 'ATIVA'", [roomId]),
        activeRooms: (c, localId) => one(c, "SELECT COUNT(*) AS total FROM salas WHERE id_local = ? AND status = 'ATIVA'", [localId]),
        roomSessions: (c, roomId) => one(c, 'SELECT id_sessao FROM sessoes WHERE id_sala = ? LIMIT 1', [roomId]),
        localSessions: (c, localId) => one(c, 'SELECT s.id_sessao FROM sessoes s JOIN salas sa ON sa.id_sala = s.id_sala WHERE sa.id_local = ? LIMIT 1', [localId])
    };
}
