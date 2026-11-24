import { ApiError } from '../utils/ApiError.js';
import { unitReadLocation } from './unitReadScope.js';
import { idString, moneyString } from '../utils/dto.js';

const HOUR = 3_600_000, DAY = 24 * HOUR;
const TRAILER_MINUTES = 30;
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
export function operationalStatus(row, now = Date.now()) {
    if (row.status !== 'AGENDADA') return row.status;
    const { start, end } = interval(row);
    if (now >= end) return 'EXPIRADA';
    return now >= start + 15 * 60_000 ? 'ATRASADA' : 'AGENDADA';
}
export function sessionDto(row) {
    const { end } = interval(row);
    return { id_sessao: idString(row.id_sessao), id_filme: idString(row.id_filme), id_sala: idString(row.id_sala), id_local: idString(row.id_local),
        titulo_filme: row.titulo_filme ?? null, nome_sala: row.nome_sala ?? null, nome_local: row.nome_local ?? null,
        data: row.data, data_fim: day(end), horario_inicio: row.horario_inicio, horario_fim: row.horario_fim,
        idioma: row.idioma, preco_inteira: moneyString(row.preco_inteira), status: row.status,
        status_operacional: operationalStatus(row), arquivada_em: row.arquivada_em ?? null,
        ...(Object.hasOwn(row, 'imagem_filme') && { imagem_filme: row.imagem_filme, classificacao_filme: row.classificacao_filme }),
        ...(row.assentos_ativos!=null && { activeSeats:Number(row.assentos_ativos), availableSeats:Number(row.assentos_disponiveis) }) };
}
export function createSessionService({ model, identity, refunds }) {
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
    async function playable(c, row, local, room, autoEnd = false) {
        if (local.status !== 'ATIVO' || room.sala_status !== 'ATIVA') throw conflict('Local ou sala indisponível');
        if (Number((await model.activeSeats(room.id_sala, c))?.total ?? 0) !== room.capacidade) throw conflict('Capacidade da sala inconsistente');
        const film = found(await model.film(row.id_filme, c, true));
        if (film.status !== 'ATIVO' || !film.disponivel_cinema || !Number.isInteger(film.duracao) || film.duracao <= 0) throw conflict('Filme indisponível para cinema');
        if (autoEnd) {
            const runtime = (film.duracao + TRAILER_MINUTES) * 60_000;
            if (runtime >= DAY) throw conflict('A sessão com trailers deve durar menos de 24 horas');
            row.horario_fim = new Date(timeMs(row.horario_inicio) + runtime).toISOString().slice(11, 19);
        }
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
    async function mutate(operation, context, localId, unit) {
        return identity.transaction(async c => {
            await authorize(c, context, localId, unit);
            return operation(c);
        }, context, { readCommitted:true });
    }
    async function requireOffer(c, localId, filmId) {
        if (Number((await model.filmOffer(c, localId, filmId))?.ativa) !== 1) throw conflict('Adicione este filme à oferta da unidade antes de agendar');
    }
    async function changeState(c, previous, next, context) {
        if (previous.status === next && ['INTERROMPIDA','CANCELADA'].includes(next)) return;
        const allowed = {
            AGENDADA: ['EM_CARTAZ', 'CANCELADA'],
            EM_CARTAZ: ['ENCERRADA', 'INTERROMPIDA', 'CANCELADA'],
            INTERROMPIDA: ['CANCELADA']
        };
        if (!allowed[previous.status]?.includes(next) || next === 'EM_CARTAZ' && operationalStatus(previous) === 'EXPIRADA') {
            throw conflict('Transição de sessão inválida');
        }
        const id = idString(previous.id_sessao);
        if (previous.status === 'AGENDADA' && next === 'CANCELADA' && await model.hasItems(id, c)) {
            throw conflict('Sessão agendada com itens de pedido não pode ser cancelada');
        }
        await model.update(c, id, { status: next });
        if (['INTERROMPIDA','CANCELADA'].includes(next)) {
            for (const { id_pagamento } of await model.affectedPayments(c, id)) {
                await refunds.reviewStoppedSession(c, id_pagamento, [id], context);
            }
        }
        await identity.audit(c, { CANCELADA:'SESSION.CANCELLED', INTERROMPIDA:'SESSION.INTERRUPTED' }[next] ?? 'SESSION.CHANGED', id, context);
    }
    return {
        async unitFilmOffers(q, context) {
            return identity.transaction(async c => {
                const localId = await unitReadLocation(c, await identity.activeActor(c, context), q.localId);
                const rows = await model.filmOffers(c, localId, q);
                const page = rows.slice(0, q.limit);
                const items = page.map(row => ({ ...row, id_filme:idString(row.id_filme) }));
                return { items, pagination:{ limit:q.limit, nextCursor:rows.length > q.limit ? items.at(-1).id_filme : null } };
            }, context);
        },
        async saveUnitFilmOffer(filmId, note, action, context) {
            return identity.transaction(async c => {
                const localId = await unitLocation(c, context);
                found(await model.local(localId, c));
                const film = found(await model.film(filmId, c));
                const offered = Number((await model.filmOffer(c, localId, filmId))?.ativa) === 1;
                if (action === 'add' && (film.status !== 'ATIVO' || !film.disponivel_cinema)) throw conflict('Filme indisponível para cinema');
                if (action === 'edit' && !offered) throw ApiError.naoEncontrado();
                if (action === 'remove' && !offered) return;
                if (action === 'add' && offered) throw conflict('O filme já está na oferta da unidade');
                await model.saveFilmOffer(c, localId, filmId, action !== 'remove', note);
                await identity.audit(c, {add:'SESSION.FILM_OFFER_ADDED',edit:'SESSION.FILM_OFFER_CHANGED',remove:'SESSION.FILM_OFFER_REMOVED'}[action], filmId, context);
            }, context, { readCommitted:true });
        },
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
                const actor = await identity.activeActor(c, context);
                const localId = await unitReadLocation(c, actor, q.localId);
                if (q.localId && idString(q.localId) !== localId) throw ApiError.acessoNegado();
                const scoped = { visibility:'programming', ...q, localId, collaboratorId:actor.tipo_usuario==='COLABORADOR'?actor.id_usuario:null };
                const rows = await model.list(scoped, true, c), items = rows.slice(0, scoped.limit);
                return { items: items.map(row => ({ ...sessionDto(row), duracao_filme: row.duracao_filme,
                    can_consult:actor.tipo_usuario==='SUPERVISOR'||Number(row.can_consult)===1 })), trailerMinutes: TRAILER_MINUTES,
                    pagination: { limit: scoped.limit, nextCursor: rows.length > scoped.limit ? idString(items.at(-1).id_sessao) : null } };
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
            const rows=await model.seatAvailability(id,undefined,{futureOnly:true}),session=found(rows[0]);
            return {sessionId:idString(session.id_sessao),roomId:idString(session.id_sala),locationId:idString(session.id_local),
                seats:rows.filter(row=>row.id_assento!=null).map(row=>({seatId:idString(row.id_assento),row:row.fileira,
                    number:row.numero,position:row.posicao_visual??row.numero,type:row.tipo,availability:row.disponibilidade}))};
        },
        async get(id, isAdmin = false) { return sessionDto(found(isAdmin ? await model.session(id) : await model.publicSession(id))); },
        async create(input, context, unit = false) {
            const initial = await initialRow('room', input.id_sala, context, unit);
            return mutate(async c => {
                const { local, room } = await lockedRoom(c, input.id_sala, initial.id_local);
                const row = { ...input, status: 'AGENDADA' };
                await playable(c, row, local, room, unit);
                if (unit) await requireOffer(c, local.id_local, row.id_filme);
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
                if (input.status) {
                    await changeState(c, previous, input.status, context);
                } else {
                    if (previous.status !== 'AGENDADA') throw conflict('Somente sessão agendada pode ser editada');
                    if (await model.hasItems(id, c)) throw conflict('Sessão com itens de pedido não pode alterar direitos');
                    const proposed = { ...previous, ...input };
                    const autoEnd = unit && ['id_filme', 'horario_inicio', 'horario_fim'].some(key => Object.hasOwn(input, key));
                    await playable(c, proposed, local, room, autoEnd);
                    if (unit && input.id_filme && idString(previous.id_filme) !== input.id_filme) await requireOffer(c, local.id_local, input.id_filme);
                    if (autoEnd) input = { ...input, horario_fim: proposed.horario_fim };
                    if (['data','horario_inicio','horario_fim'].some(k => Object.hasOwn(input, k))) await noOverlap(c, local.id_local, proposed, id);
                    await model.update(c, id, input);
                    await identity.audit(c, 'SESSION.CHANGED', id, context);
                }
                return sessionDto(found(await model.session(id, c)));
            }, context, initial.id_local, unit);
        },
        async cancel(id, context, unit = false) {
            const initial = await initialRow('session', id, context, unit);
            return mutate(async c => {
                const { room } = await lockedRoom(c, initial.id_sala, initial.id_local);
                const previous = found(await model.sessionForUpdate(id, c));
                if (idString(previous.id_sala) !== idString(room.id_sala)) throw conflict('Sala da sessão mudou');
                await changeState(c, previous, 'CANCELADA', context);
            }, context, initial.id_local, unit);
        },
        async archive(id, context, unit = false) {
            const initial = await initialRow('session', id, context, unit);
            return mutate(async c => {
                await lockedRoom(c, initial.id_sala, initial.id_local);
                const previous = found(await model.sessionForUpdate(id, c));
                if (!['ENCERRADA', 'CANCELADA'].includes(previous.status)) throw conflict('Somente sessões encerradas ou canceladas podem ser arquivadas');
                if (previous.arquivada_em) return;
                await model.archive(c, id);
                await identity.audit(c, 'SESSION.ARCHIVED', id, context);
            }, context, initial.id_local, unit);
        }
    };
}
