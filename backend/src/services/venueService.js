import { ApiError } from '../utils/ApiError.js';
import { unitReadLocation } from './unitReadScope.js';
import { idString } from '../utils/dto.js';

const fields = {
    local: ['nome', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'telefone', 'status','tipo_local','lotacao_eventos','acesso_eventos','imagem_url'],
    room: ['id_local', 'nome', 'capacidade', 'tipo', 'status'],
    seat: ['id_sala', 'fileira', 'numero', 'tipo', 'status','posicao_visual']
};
const pk = { local: 'id_local', room: 'id_sala', seat: 'id_assento' };
const found = value => { if (!value) throw ApiError.naoEncontrado(); return value; };
const conflict = message => new ApiError(message, 409, null, 'VENUE_CONFLICT');
const total = row => Number(row?.total ?? 0);
export function venueDto(kind, row) {
    const dto = { [pk[kind]]: idString(row[pk[kind]]) };
    for (const key of fields[kind]) dto[key] = key.startsWith('id_') ? idString(row[key]) : row[key] ?? null;
    if (kind === 'local' && row.slug) dto.slug = row.slug;
    if (kind === 'seat') dto.acessivel = ['PCD', 'OBESO', 'IDOSO'].includes(dto.tipo);
    return dto;
}
export function createVenueService({ model, identity }) {
    async function admin(c, context) { if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado(); }
    async function unit(c, contextValue, localId) {
        const actor = await identity.activeActor(c, contextValue);
        if (actor.tipo_usuario !== 'SUPERVISOR') throw ApiError.acessoNegado();
        const location = await model.supervisorLocation(actor.id_usuario, c);
        if (!location || idString(location.id_local) !== idString(localId)) throw ApiError.acessoNegado();
    }
    async function local(id, c, lock) { return found(await model.local(id, c, lock)); }
    async function room(localId, id, c, lock) { return found(await model.room(localId, id, c, lock)); }
    async function seat(roomId, id, c, lock) { return found(await model.seat(roomId, id, c, lock)); }
    function visible(row, kind) { if (row.status !== (kind === 'local' ? 'ATIVO' : 'ATIVA')) throw ApiError.naoEncontrado(); return row; }
    async function context(kind, ids, adminRead = false, c, lock = false) {
        const place = ids.localId ? await local(ids.localId, c, lock) : null;
        if (place && !adminRead) visible(place, 'local');
        const hall = kind !== 'local' && ids.roomId ? await room(ids.localId, ids.roomId, c, lock) : null;
        if (hall && !adminRead) visible(hall, 'room');
        const chair = kind === 'seat' && ids.seatId ? await seat(ids.roomId, ids.seatId, c, lock) : null;
        if (chair && !adminRead) visible(chair, 'seat');
        return { place, hall, chair };
    }
    async function safeMutation(operation, contextValue, localId, unitAccess = false) {
        try { return await identity.transaction(async c => { if (unitAccess) await unit(c, contextValue, localId); else await admin(c, contextValue); return operation(c); }, contextValue); }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw conflict('Nome ou assento já existe neste contexto');
            throw error;
        }
    }
    function page(kind, rows, q) { const items = rows.slice(0, q.limit); return { items: items.map(r => venueDto(kind, r)), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1)[pk[kind]]) : null } }; }
    async function requireMutableRoom(c, roomId) { if (await model.roomSessions(c, roomId)) throw conflict('Sala com sessões vinculadas não admite alteração estrutural'); }
    const layoutDto=(place,hall,rows,structureLocked)=>({room:venueDto('room',hall),spaceType:place.tipo_local??'CINEMA',structureLocked,
        seats:rows.map(row=>venueDto('seat',row))});
    function checkPositions(rows){
        const slots=new Set();
        for(const row of rows){
            const position=row.posicao_visual??row.numero;
            const key=`${row.fileira}:${position}`;
            if(slots.has(key))throw conflict(`A posição ${position} da fileira ${row.fileira} já está ocupada.`);
            slots.add(key);
        }
    }
    return {
        async publicRoomScene(ids) {
            await context('room', ids);
            const row = await model.roomScene(null, ids.roomId);
            const scene = typeof row?.cena_3d === 'string' ? JSON.parse(row.cena_3d) : row?.cena_3d;
            if (!scene) throw ApiError.naoEncontrado();
            return scene;
        },
        publishRoomScene(ids, scene, contextValue, unitAccess = false) {
            return safeMutation(async c => {
                await context('room', ids, true, c, true);
                const seats = await model.seatLayout(c, ids.roomId, true);
                const missing = new Set(seats.filter(row => row.status === 'ATIVA').map(row => idString(row.id_assento)));
                const idsUsed = new Set();
                for (const item of scene.objects) {
                    if (idsUsed.has(item.id)) throw conflict('O arquivo tem objetos com IDs repetidos.');
                    idsUsed.add(item.id);
                    if (item.seatId && (!['seat','vip','bench','car'].includes(item.type) || !missing.delete(item.seatId))) {
                        throw conflict('Cada lugar da cena deve estar ligado uma vez a um assento ativo desta sala.');
                    }
                }
                if (!seats.some(row => row.status === 'ATIVA') || missing.size) {
                    throw conflict('Vincule todos os assentos ativos da sala antes de publicar.');
                }
                await model.saveRoomScene(c, ids.roomId, scene);
                await identity.audit(c, 'VENUE.ROOM_SCENE_PUBLISHED', ids.roomId, contextValue);
                return { published: true };
            }, contextValue, ids.localId, unitAccess);
        },
        layout(ids,contextValue,unitAccess=false){
            return identity.transaction(async c=>{
                if(unitAccess)await unitReadLocation(c,await identity.activeActor(c,contextValue),ids.localId);
                else await admin(c,contextValue);
                const {place,hall}=await context('room',ids,true,c);
                return layoutDto(place,hall,await model.seatLayout(c,ids.roomId),Boolean(await model.roomSessions(c,ids.roomId)));
            },contextValue);
        },
        batchSeats(ids,input,contextValue,unitAccess=false){
            return safeMutation(async c=>{
                const {place,hall}=await context('room',ids,true,c,true);
                await requireMutableRoom(c,ids.roomId);
                const existing=await model.seatLayout(c,ids.roomId,true);
                const all=[...existing,...input.seats];
                if(all.filter(row=>row.status==='ATIVA').length>hall.capacidade)throw conflict('O lote excede a capacidade de assentos ativos da sala.');
                checkPositions(all);
                await model.insertSeats(c,ids.roomId,input.seats);
                await identity.audit(c,'VENUE.SEATS_BATCH_CREATED',ids.roomId,contextValue);
                return layoutDto(place,hall,await model.seatLayout(c,ids.roomId),false);
            },contextValue,ids.localId,unitAccess);
        },
        moveSeats(ids,input,contextValue,unitAccess=false){
            return safeMutation(async c=>{
                const {place,hall}=await context('room',ids,true,c,true);
                const existing=await model.seatLayout(c,ids.roomId,true);
                const changes=new Map(input.moves.map(move=>[move.seatId,move.position]));
                const updated=[];
                const layout=existing.map(row=>{
                    const seatId=idString(row.id_assento);
                    if(!changes.has(seatId))return row;
                    const position=changes.get(seatId);
                    changes.delete(seatId);
                    if((row.posicao_visual??null)!==position)updated.push({seatId,position});
                    return {...row,posicao_visual:position};
                });
                if(changes.size)throw ApiError.naoEncontrado();
                checkPositions(layout);
                if(updated.length){
                    // Temporary slots outside the input range allow atomic moves and swaps.
                    await model.moveSeats(c,ids.roomId,updated.map((move,index)=>({...move,position:4294967295-index})));
                    await model.moveSeats(c,ids.roomId,updated);
                    await identity.audit(c,'VENUE.SEAT_POSITIONS_CHANGED',ids.roomId,contextValue);
                }
                return layoutDto(place,hall,layout,Boolean(await model.roomSessions(c,ids.roomId)));
            },contextValue,ids.localId,unitAccess);
        },
        async list(kind, ids, q, adminRead = false) {
            if (kind !== 'local') await context(kind, ids, adminRead);
            const parentId = kind === 'room' ? ids.localId : kind === 'seat' ? ids.roomId : null;
            return page(kind, await model.list(kind, parentId, q, adminRead), q);
        },
        async get(kind, ids, adminRead = false) {
            const { place, hall, chair } = await context(kind, ids, adminRead);
            return venueDto(kind, kind === 'local' ? place : kind === 'room' ? hall : chair);
        },
        async unitList(kind, ids, q, contextValue) {
            if (!['room', 'seat'].includes(kind)) throw ApiError.acessoNegado();
            return identity.transaction(async c => {
                await unitReadLocation(c, await identity.activeActor(c, contextValue), ids.localId);
                await context(kind, ids, true, c);
                return page(kind, await model.list(kind, kind === 'room' ? ids.localId : ids.roomId, q, true, c), q);
            }, contextValue);
        },
        async unitGet(kind, ids, contextValue) {
            if (!['room', 'seat'].includes(kind)) throw ApiError.acessoNegado();
            return identity.transaction(async c => {
                await unitReadLocation(c, await identity.activeActor(c, contextValue), ids.localId);
                const { hall, chair } = await context(kind, ids, true, c);
                return venueDto(kind, kind === 'room' ? hall : chair);
            }, contextValue);
        },
        async save(kind, ids, input, contextValue, unitAccess = false) {
            return safeMutation(async c => {
                const { place, hall, chair } = await context(kind, ids, true, c, true);
                const previous = kind === 'local' ? place : kind === 'room' ? hall : chair;
                const id = kind === 'local' ? ids.localId : kind === 'room' ? ids.roomId : ids.seatId;
                if (kind === 'local') {
                    if (id && Object.keys(input).some(k => !['cep','telefone','tipo_local','lotacao_eventos','acesso_eventos','imagem_url'].includes(k)) && await model.localSessions(c, id)) throw conflict('Local com sessões vinculadas não admite alteração estrutural');
                    if (id && input.status && input.status !== 'ATIVO' && total(await model.activeRooms(c, id)) > 0) throw conflict('Desative as salas antes do local');
                } else if (kind === 'room') {
                    if (id && Object.keys(input).some(key => key !== 'nome')) await requireMutableRoom(c, id);
                    const next = { ...previous, ...input };
                    if (next.status === 'ATIVA') {
                        if (place.status !== 'ATIVO') throw conflict('Local inativo ou em manutenção');
                        if (!id) throw conflict('Cadastre os assentos antes de ativar a sala');
                        if (total(await model.activeSeats(c, id)) !== next.capacidade) {
                            throw new ApiError('A capacidade deve corresponder à quantidade de assentos ativos.', 409, null, 'ROOM_CAPACITY_MISMATCH');
                        }
                    }
                } else {
                    if(!id||Object.keys(input).some(key=>key!=='posicao_visual'))await requireMutableRoom(c, ids.roomId);
                    const nextStatus = input.status ?? previous?.status ?? 'ATIVA';
                    if (hall.status === 'ATIVA' && id && nextStatus !== previous.status) throw conflict('Desative a sala antes de alterar assentos ativos');
                    if (nextStatus === 'ATIVA' && (!id || previous.status !== 'ATIVA') && total(await model.activeSeats(c, ids.roomId)) >= hall.capacidade) {
                        throw new ApiError('A sala atingiu o limite de assentos ativos.', 409, null, 'ROOM_CAPACITY_REACHED');
                    }
                }
                const parentId = kind === 'room' ? ids.localId : kind === 'seat' ? ids.roomId : null;
                const key = id ? (await model.update(kind, c, id, input), id) : await model.insert(kind, c, parentId, input);
                await identity.audit(c, `VENUE.${kind.toUpperCase()}_${id ? 'CHANGED' : 'CREATED'}`, key, contextValue);
                const row = kind === 'local' ? await local(key, c) : kind === 'room' ? await room(ids.localId, key, c) : await seat(ids.roomId, key, c);
                return venueDto(kind, row);
            }, contextValue, ids.localId, unitAccess);
        },
        async archive(kind, ids, contextValue, unitAccess = false) {
            return safeMutation(async c => {
                const { place, hall } = await context(kind, ids, true, c, true);
                const key = kind === 'local' ? ids.localId : kind === 'room' ? ids.roomId : ids.seatId;
                if (kind === 'local') {
                    if (await model.localSessions(c, key)) throw conflict('Local com sessões vinculadas não pode ser arquivado');
                    if (total(await model.activeRooms(c, key)) > 0) throw conflict('Desative as salas antes do local');
                } else if (kind === 'room') await requireMutableRoom(c, key);
                else {
                    await requireMutableRoom(c, ids.roomId);
                    if (hall.status === 'ATIVA') throw conflict('Desative a sala antes de arquivar assentos');
                }
                await model.update(kind, c, key, { status: kind === 'local' ? 'INATIVO' : 'INATIVA' });
                await identity.audit(c, `VENUE.${kind.toUpperCase()}_ARCHIVED`, key, contextValue);
            }, contextValue, ids.localId, unitAccess);
        }
    };
}
