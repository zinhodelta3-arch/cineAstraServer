import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const select = `SELECT s.id_solicitacao,s.id_experiencia,s.id_local,s.id_responsavel,s.titulo,
    DATE_FORMAT(s.data_desejada,'%Y-%m-%d') AS data_desejada,TIME_FORMAT(s.horario_desejado,'%H:%i') AS horario_desejado,
    s.quantidade,s.descricao,s.preferencias,s.status,s.atualizada_em,l.nome AS unidade
    FROM solicitacoes_experiencia s LEFT JOIN locais l ON l.id_local=s.id_local`;
const scope = actor => {
    if (actor.tipo_usuario === 'ADMIN') return { clause: '1=1', args: [] };
    if (actor.tipo_usuario === 'CLIENTE') return { clause: 's.id_cliente=?', args: [actor.id_usuario] };
    if (actor.tipo_usuario === 'SUPERVISOR') return {
        clause: 'EXISTS(SELECT 1 FROM supervisor_locais sl WHERE sl.id_local=s.id_local AND sl.id_supervisor=?) AND (s.id_responsavel IS NULL OR s.id_responsavel=?)',
        args: [actor.id_usuario, actor.id_usuario]
    };
    throw ApiError.acessoNegado();
};
const dto = row => ({
    id: idString(row.id_solicitacao), protocol: 'EXP-' + row.id_solicitacao, title: row.titulo, status: row.status,
    locationId: row.id_local == null ? null : idString(row.id_local), location: row.unidade,
    date: row.data_desejada, time: row.horario_desejado, guests: row.quantidade, details: row.descricao,
    preferences: row.preferencias, updatedAt: row.atualizada_em
});
const one = async (connection, sql, values) => (await connection.execute(sql, values))[0][0];
const writeEvent = (connection, requestId, type, sender, text) => connection.execute(
    'INSERT INTO historico_experiencia(id_solicitacao,tipo,remetente,texto) VALUES(?,?,?,?)',
    [requestId, type, sender, text]
);
const transitions = {
    RECEBIDA: ['EM_ANALISE', 'CANCELADA'],
    EM_ANALISE: ['PROPOSTA_ENVIADA', 'CONCLUIDA', 'CANCELADA'],
    PROPOSTA_ENVIADA: ['EM_ANALISE', 'CONCLUIDA', 'CANCELADA'],
    CONCLUIDA: [], CANCELADA: []
};

export function createExperienceRequestService({ identity, promotional }) {
    const run = (context, operation) => identity.transaction(async connection => {
        const actor = await identity.activeActor(connection, context);
        return operation(connection, actor);
    }, context);
    async function find(connection, actor, id, lock = false) {
        const visibility = scope(actor);
        const row = await one(connection, select + ` WHERE s.id_solicitacao=? AND ${visibility.clause}${lock ? ' FOR UPDATE' : ''}`,
            [id, ...visibility.args]);
        if (!row) throw ApiError.naoEncontrado();
        return row;
    }
    return {
        create: (input, context) => run(context, async (connection, actor) => {
            if (actor.tipo_usuario !== 'CLIENTE') throw ApiError.acessoNegado();
            const item = await promotional.get(connection, 'experiences', input.experienceId, false, true);
            if (!item) throw ApiError.naoEncontrado();
            if (item.lotacao_eventos != null && input.guests > item.lotacao_eventos) throw ApiError.validacao('A quantidade excede a lotação do local.');
            const data = typeof item.dados === 'string' ? JSON.parse(item.dados) : item.dados;
            const [result] = await connection.execute(`INSERT INTO solicitacoes_experiencia
                (id_experiencia,id_cliente,id_local,titulo,data_desejada,horario_desejado,quantidade,descricao,preferencias)
                VALUES(?,?,?,?,?,?,?,?,?)`, [input.experienceId, actor.id_usuario, item.id_local_evento, data.title, input.date,
                input.time ?? null, input.guests, input.details, input.preferences || null]);
            const id = idString(result.insertId);
            await writeEvent(connection, id, 'STATUS', 'CLIENTE', 'RECEBIDA');
            return dto(await find(connection, actor, id));
        }),
        list: (cursor, context) => run(context, async (connection, actor) => {
            const visibility = scope(actor);
            const [rows] = await connection.execute(select + ` WHERE ${visibility.clause}${cursor ? ' AND s.id_solicitacao<?' : ''} ORDER BY s.id_solicitacao DESC LIMIT 21`,
                [...visibility.args, ...(cursor ? [cursor] : [])]);
            return { items: rows.slice(0, 20).map(dto), nextCursor: rows.length > 20 ? idString(rows[19].id_solicitacao) : null };
        }),
        get: (id, cursor, context) => run(context, async (connection, actor) => {
            const row = await find(connection, actor, id);
            const [events] = await connection.execute(`SELECT id_evento,tipo,remetente,texto,criado_em FROM historico_experiencia
                WHERE id_solicitacao=?${cursor ? ' AND id_evento<?' : ''} ORDER BY id_evento DESC LIMIT 51`, [id, ...(cursor ? [cursor] : [])]);
            return { ...dto(row), canClaim: actor.tipo_usuario === 'SUPERVISOR' && row.id_responsavel == null,
                events: events.slice(0, 50).map(event => ({
                id: idString(event.id_evento), type: event.tipo, sender: event.remetente, text: event.texto, createdAt: event.criado_em
            })), nextCursor: events.length > 50 ? idString(events[49].id_evento) : null };
        }),
        message: (id, text, context) => run(context, async (connection, actor) => {
            const row = await find(connection, actor, id, true);
            if (!transitions[row.status].length) throw ApiError.validacao('A solicitação está encerrada.');
            await writeEvent(connection, id, 'MENSAGEM', actor.tipo_usuario === 'CLIENTE' ? 'CLIENTE' : 'EQUIPE', text);
            await connection.execute('UPDATE solicitacoes_experiencia SET atualizada_em=CURRENT_TIMESTAMP(3) WHERE id_solicitacao=?', [id]);
            return { id };
        }),
        update: (id, input, context) => run(context, async (connection, actor) => {
            if (!['ADMIN', 'SUPERVISOR'].includes(actor.tipo_usuario)) throw ApiError.acessoNegado();
            const row = await find(connection, actor, id, true);
            if (!transitions[row.status].length) throw ApiError.validacao('A solicitação está encerrada.');
            if (input.locationId && actor.tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
            const locationId = input.locationId ?? row.id_local;
            const moved = input.locationId && input.locationId !== String(row.id_local);
            const supervisorId = input.supervisorId ?? (moved ? null : row.id_responsavel);
            if (actor.tipo_usuario === 'SUPERVISOR' && input.supervisorId && input.supervisorId !== idString(actor.id_usuario)) throw ApiError.acessoNegado();
            if (input.locationId && !await one(connection, "SELECT id_local FROM locais WHERE id_local=? AND status='ATIVO' FOR UPDATE", [locationId])) {
                throw ApiError.validacao('Selecione uma unidade ativa.');
            }
            if (input.supervisorId && (!locationId || !await one(connection, `SELECT sl.id_supervisor FROM supervisor_locais sl
                JOIN usuarios u ON u.id_usuario=sl.id_supervisor WHERE sl.id_local=? AND sl.id_supervisor=? AND u.tipo_usuario='SUPERVISOR' AND u.status='ATIVO' FOR UPDATE`,
            [locationId, supervisorId]))) throw ApiError.validacao('Selecione um supervisor ativo dessa unidade.');
            if (input.status && input.status !== row.status && !transitions[row.status].includes(input.status)) throw ApiError.validacao('Essa mudança de status não é permitida.');
            const status = input.status ?? row.status;
            await connection.execute('UPDATE solicitacoes_experiencia SET id_local=?,id_responsavel=?,status=? WHERE id_solicitacao=?',
                [locationId, supervisorId, status, id]);
            if (moved || (input.supervisorId && input.supervisorId !== String(row.id_responsavel))) {
                await writeEvent(connection, id, 'ATRIBUICAO', 'EQUIPE', moved ? 'Solicitação encaminhada à unidade responsável.' : 'Responsável atribuído à solicitação.');
            }
            if (status !== row.status) await writeEvent(connection, id, 'STATUS', 'EQUIPE', status);
            return dto(await find(connection, actor, id));
        })
    };
}
