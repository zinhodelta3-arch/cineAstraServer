import { ApiError } from '../utils/ApiError.js';
import { unitReadLocation } from './unitReadScope.js';
import { idString, moneyString } from '../utils/dto.js';

const HOUR = 3_600_000, DAY = 24 * HOUR;
const found = value => { if (!value) throw ApiError.naoEncontrado(); return value; };
const conflict = message => new ApiError(message, 409, null, 'SESSION_CONFLICT');
const dateMs = date => Date.parse(`${date}T00:00:00Z`);
const timeMs = time => { const [h, m, s] = time.split(':').map(Number); return (h * 3600 + m * 60 + s) * 1000; };
const day = ms => new Date(ms).toISOString().slice(0, 10);
export function interval(row) {
    const start = dateMs(row.data) + timeMs(row.horario_inicio);
    let end = dateMs(row.data) + timeMs(row.horario_fim);
    if (row.horario_fim === row.horario_inicio) throw ApiError.validacao('Início e fim não podem ser iguais');
    if (end < start) end += DAY;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start >= DAY) throw ApiError.validacao('Intervalo de sessão inválido');
    return { start, end };
}
export function sessionDto(row) {
    const { end } = interval(row);
    return { id_sessao: idString(row.id_sessao), id_filme: idString(row.id_filme), id_sala: idString(row.id_sala), id_local: idString(row.id_local),
        titulo_filme: row.titulo_filme ?? null, nome_sala: row.nome_sala ?? null, nome_local: row.nome_local ?? null,
        data: row.data, data_fim: day(end), horario_inicio: row.horario_inicio, horario_fim: row.horario_fim,
        idioma: row.idioma, preco_inteira: moneyString(row.preco_inteira), status: row.status,
        ...(row.assentos_ativos!=null && { activeSeats:Number(row.assentos_ativos), availableSeats:Number(row.assentos_disponiveis) }) };
}
export function createSessionService({ model, identity }) {
    async function unitLocation(c, context) {
        const actor = await identity.activeActor(c, context);
        if (actor.tipo_usuario !== 'SUPERVISOR') throw ApiError.acessoNegado();
        const location = await model.supervisorLocation(actor.id_usuario, c);
        if (!location) throw ApiError.acessoNegado();
        return idString(location.id_local);
    }
    async function authorize(c, context, localId, unit) {
        if (unit) {
            if (await unitLocation(c, context) !== idString(localId)) throw ApiError.acessoNegado();
        } else if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
    }
    async function initialRow(kind, id, context, unit) {
        if (!unit) return found(await model[kind](id));
        return identity.transaction(async c => {
            const localId = await unitLocation(c, context);
            const row = await model[kind](id, c);
            if (!row || idString(row.id_local) !== localId) throw ApiError.acessoNegado();
            return row;
        }, context);
    }
    async function lockedRoom(c, roomId, expectedLocalId) {
        const local = found(await model.local(expectedLocalId, c, true));
        const room = found(await model.room(roomId, c, true));
        if (idString(room.id_local) !== idString(local.id_local)) throw conflict('Sala mudou de local');
        return { local, room };
    }
    async function playable(c, row, local, room) {
        if (local.status !== 'ATIVO' || room.sala_status !== 'ATIVA') throw conflict('Local ou sala indisponível');
        if (Number((await model.activeSeats(room.id_sala, c))?.total ?? 0) !== room.capacidade) throw conflict('Capacidade da sala inconsistente');
        const film = found(await model.film(row.id_filme, c, true));
        if (film.status !== 'ATIVO' || !film.disponivel_cinema || !Number.isInteger(film.duracao) || film.duracao <= 0) throw conflict('Filme indisponível para cinema');
        const span = interval(row);
        if (span.end - span.start < Number(film.duracao) * 60_000) throw ApiError.validacao('Sessão menor que a duração do filme');
        return span;
    }
    async function noOverlap(c, localId, row, excludeId) {
        const current = interval(row);
        const candidates = await model.overlapCandidates(localId, day(dateMs(row.data) - 2 * DAY), day(dateMs(row.data) + 2 * DAY), excludeId, c);
        for (const other of candidates) {
            const occupied = interval(other);
            if (current.start < occupied.end + HOUR && occupied.start < current.end + HOUR) throw conflict('Intervalo mínimo de uma hora entre sessões no mesmo local');
        }
    }
    async function mutate(operation, context, localId, unit) { return identity.transaction(async c => { await authorize(c, context, localId, unit); return operation(c); }, context); }
    return {
        async filmAvailability(filmId) {
            const rows=await model.filmAvailability(filmId);
            return {locations:rows.map((row,index)=>({
                localId:idString(row.id_local),name:row.nome,sessions:Number(row.session_count),
                openSessions:Number(row.open_sessions),nextDate:row.next_open?.slice(0,10)??null,
                nextTime:row.next_open?.slice(11,16)??null,popular:index===0&&Number(row.sold)>0&&Number(row.sold)>Number(rows[1]?.sold??0),
                formats:row.formats?.split(' · ')??[]
            }))};
        },
        async availableDays(filmId, localId) { return { days: (await model.availableDays(filmId, localId)).map(row => row.date.slice(0, 10)) }; },
        async upcomingForFilm(filmId, filters) {
            const rows = await model.upcomingForFilm(filmId, filters);
            return { items: rows.slice(0, 6).map(sessionDto), hasMore: rows.length > 6 };
        },
        async list(q, isAdmin = false) {
            const rows = await model.list(q, isAdmin), items = rows.slice(0, q.limit);
            return { items: items.map(sessionDto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_sessao) : null } };
        },
        async unitList(q, context) {
            return identity.transaction(async c => {
                const localId = await unitReadLocation(c, await identity.activeActor(c, context), q.localId);
                if (q.localId && idString(q.localId) !== localId) throw ApiError.acessoNegado();
                const scoped = { ...q, localId }, rows = await model.list(scoped, true, c), items = rows.slice(0, scoped.limit);
                return { items: items.map(sessionDto), pagination: { limit: scoped.limit, nextCursor: rows.length > scoped.limit ? idString(items.at(-1).id_sessao) : null } };
            }, context);
        },
        async unitGet(id, context) {
            return identity.transaction(async c => {
                const session = found(await model.session(id, c));
                const localId = await unitReadLocation(c, await identity.activeActor(c, context), session.id_local);
                if (idString(session.id_local) !== localId) throw ApiError.acessoNegado();
                return sessionDto(session);
            }, context);
        },
        async seats(id) {
            const rows=await model.seatAvailability(id),session=found(rows[0]);
            return {sessionId:idString(session.id_sessao),roomId:idString(session.id_sala),locationId:idString(session.id_local),
                seats:rows.filter(row=>row.id_assento!=null).map(row=>({seatId:idString(row.id_assento),row:row.fileira,
                    number:row.numero,type:row.tipo,availability:row.disponibilidade}))};
        },
        async get(id, isAdmin = false) { return sessionDto(found(isAdmin ? await model.session(id) : await model.publicSession(id))); },
        async create(input, context, unit = false) {
            const initial = await initialRow('room', input.id_sala, context, unit);
            return mutate(async c => {
                const { local, room } = await lockedRoom(c, input.id_sala, initial.id_local);
                const row = { ...input, status: 'AGENDADA' };
                await playable(c, row, local, room);
                await noOverlap(c, local.id_local, row);
                const id = await model.insert(c, row);
                await identity.audit(c, 'SESSION.CREATED', id, context);
                return sessionDto(found(await model.session(id, c)));
            }, context, initial.id_local, unit);
        },
        async patch(id, input, context, unit = false) {
            const initial = await initialRow('session', id, context, unit);
            if (input.status && Object.keys(input).length > 1) throw ApiError.validacao('Status deve ser alterado separadamente');
            return mutate(async c => {
                const { local, room } = await lockedRoom(c, initial.id_sala, initial.id_local);
                const previous = found(await model.sessionForUpdate(id, c));
                if (idString(previous.id_sala) !== idString(room.id_sala)) throw conflict('Sala da sessão mudou');
                const items = Boolean(await model.hasItems(id, c));
                if (input.status) {
                    const next = input.status;
                    const allowed = { AGENDADA: ['EM_CARTAZ', 'CANCELADA'], EM_CARTAZ: ['ENCERRADA', 'CANCELADA'], ENCERRADA: [], CANCELADA: [] };
                    if (!allowed[previous.status]?.includes(next)) throw conflict('Transição de sessão inválida');
                    if (next === 'CANCELADA' && items) throw conflict('Sessão com itens de pedido não pode ser cancelada');
                } else {
                    if (previous.status !== 'AGENDADA') throw conflict('Somente sessão agendada pode ser editada');
                    if (items) throw conflict('Sessão com itens de pedido não pode alterar direitos');
                    const proposed = { ...previous, ...input };
                    await playable(c, proposed, local, room);
                    if (['data','horario_inicio','horario_fim'].some(k => Object.hasOwn(input, k))) await noOverlap(c, local.id_local, proposed, id);
                }
                await model.update(c, id, input);
                await identity.audit(c, 'SESSION.CHANGED', id, context);
                return sessionDto(found(await model.session(id, c)));
            }, context, initial.id_local, unit);
        },
        async cancel(id, context, unit = false) {
            const initial = await initialRow('session', id, context, unit);
            return mutate(async c => {
                const { room } = await lockedRoom(c, initial.id_sala, initial.id_local);
                const previous = found(await model.sessionForUpdate(id, c));
                if (idString(previous.id_sala) !== idString(room.id_sala)) throw conflict('Sala da sessão mudou');
                if (previous.status === 'CANCELADA') return;
                if (!['AGENDADA', 'EM_CARTAZ'].includes(previous.status) || await model.hasItems(id, c)) throw conflict('Sessão não pode ser cancelada');
                await model.update(c, id, { status: 'CANCELADA' });
                await identity.audit(c, 'SESSION.CANCELLED', id, context);
            }, context, initial.id_local, unit);
        }
    };
}
