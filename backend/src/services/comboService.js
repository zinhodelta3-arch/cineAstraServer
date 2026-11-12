import { ApiError } from '../utils/ApiError.js';
import { unitReadLocation } from './unitReadScope.js';
import { idString, moneyString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'COMBO_CONFLICT');
const cost = row => row.custo_operacional == null ? null : moneyString(row.custo_operacional);
const eventDto = row => row.id_evento == null ? {} : {event:{eventId:idString(row.id_evento),sessionId:idString(row.id_sessao_evento),totalLimit:row.limite_evento,customerLimit:row.limite_cliente_evento}};
const dto = (row, items) => ({ id_combo: idString(row.id_combo), id_local: row.id_local === null ? null : idString(row.id_local), nome: row.nome, descricao: row.descricao ?? null, preco: moneyString(row.preco), imagem: row.imagem ?? null, ativo: Boolean(row.ativo), data_cadastro: row.data_cadastro, ...eventDto(row), items: items.map(i => ({ id_insumo: idString(i.id_insumo), nome: i.nome, quantidade: i.quantidade })) });
export function createComboService({ model, identity, pricing }) {
    async function admin(c, context) { if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado(); }
    async function transact(context, work) { return identity.transaction(async c => { await admin(c, context); return work(c); }, context); }
    async function validateEvent(c,localId,event){
        if(!event)return;
        const session=await model.eventSession(c,event);
        if(!session||idString(session.id_local)!==idString(localId))throw conflict('Vincule uma experiência e uma sessão futura do mesmo local do combo.');
    }
    async function validItems(c, localId, items) {
        const local = found(await model.local(localId, c, true));
        if (local.status !== 'ATIVO') throw conflict('Local indisponível');
        const ids = items.map(i => i.inputId);
        const rows = await model.inputs(ids, c, true);
        if (rows.length !== ids.length || rows.some(i => idString(i.id_local) !== idString(localId) || i.status !== 'DISPONIVEL' || i.fornecedor_status !== 'ATIVO' || i.usuario_status !== 'ATIVO' || i.tipo_usuario !== 'FORNECEDOR' || i.vinculo_status !== 'ATIVO')) throw conflict('Composição exige insumos disponíveis do mesmo local e fornecedor autorizado');
        return rows;
    }
    async function detail(id, c, includeCost = false) {
        const combo = found(await model.combo(id, c));
        const result = dto(combo, await model.items(id, c));
        return includeCost ? { ...result, custo_operacional: cost(combo) } : result;
    }
    return {
        async list(q) {
            const rows = await model.list(q), items = rows.slice(0, q.limit);
            return { items: await Promise.all(items.map(r => detail(r.id_combo))), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_combo) : null } };
        },
        async get(id) {
            const row = found(await model.combo(id));
            if (!row.ativo || row.id_local === null) throw ApiError.naoEncontrado();
            const visible = await model.list({ localId: idString(row.id_local), cursor: String(BigInt(id) - 1n), limit: 1 });
            if (!visible[0] || idString(visible[0].id_combo) !== idString(id)) throw ApiError.naoEncontrado();
            return detail(id);
        },
        async adminList(q,context) { return transact(context,async c=>{
            const rows=await model.adminList(c,q),page=rows.slice(0,q.limit);
            return {items:page.map(row=>({id_combo:idString(row.id_combo),id_local:row.id_local==null?null:idString(row.id_local),nome:row.nome,descricao:row.descricao??null,preco:moneyString(row.preco),custo_operacional:cost(row),ativo:Boolean(row.ativo),data_cadastro:row.data_cadastro??null,itemCount:Number(row.item_count),...eventDto(row)})),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?idString(page.at(-1).id_combo):null}};
        }); },
        async adminGet(id, context) { return transact(context,c=>detail(id,c,true)); },
        async unitList(q, context) { return identity.transaction(async c => {
            const actor = await identity.activeActor(c, context);
            const localId = await unitReadLocation(c, actor, q.localId);
            if (q.localId && idString(q.localId) !== localId) throw ApiError.acessoNegado();
            const rows = q.active === false ? [] : await model.list({ ...q, localId, inStock: true, includeEvents:true }, c);
            const page = rows.slice(0, q.limit);
            return { items: page.map(row => ({ id_combo: idString(row.id_combo), id_local: idString(row.id_local), nome: row.nome, descricao: row.descricao ?? null, preco: moneyString(row.preco), ativo: Boolean(row.ativo), itemCount: Number(row.item_count) })), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(page.at(-1).id_combo) : null } };
        }, context); },
        async unitGet(id, context) { return identity.transaction(async c => {
            const row = found(await model.combo(id, c));
            if(row.id_local==null)throw ApiError.acessoNegado();
            const actor = await identity.activeActor(c, context);
            const localId = await unitReadLocation(c, actor, row.id_local);
            const visible = await model.list({ localId, cursor: String(BigInt(id) - 1n), limit: 1, inStock: true, includeEvents:true }, c);
            if (!visible[0] || idString(visible[0].id_combo) !== idString(id)) throw ApiError.naoEncontrado();
            return dto(visible[0], await model.items(id, c));
        }, context); },
        async create(input, context) {
            return transact(context, async c => {
                const rows = await validItems(c, input.localId, input.items);
                const { priceMode, event, ...data } = input;
                await validateEvent(c,input.localId,event);
                if (priceMode === 'RULE') {
                    const quantities = new Map(data.items.map(item => [item.inputId, item.quantidade]));
                    const parts = rows.map(row => ({ ...row, quantidade: quantities.get(idString(row.id_insumo)) }));
                    data.preco = await pricing.catalogPriceForCreate(c, 'COMBO', data, parts);
                }
                const id = await model.create(c, data);
                if(event)await model.setEvent(c,id,event);
                await model.replaceItems(c, id, input.items);
                await identity.audit(c, 'COMBO.CREATED', id, context);
                return detail(id, c, true);
            });
        },
        async patch(id, input, context) {
            return transact(context, async c => {
                const initial = found(await model.combo(id, c));
                if (initial.id_local === null) throw conflict('Combo legado sem local requer saneamento');
                await model.local(initial.id_local, c, true);
                const row = found(await model.combo(id, c, true));
                if (row.id_local !== initial.id_local) throw conflict('Local alterado');
                const adminCostOnly = Object.keys(input).length === 1 && input.custo_operacional !== undefined;
                if (!row.ativo || (!adminCostOnly && await model.referenced(id, c))) throw conflict('Combo arquivado ou referenciado não pode ser alterado');
                const {event,...fields}=input;
                if(event!==undefined){
                    if(event&&await model.planUsingCombo(c,id))throw conflict('O combo de um plano não pode virar oferta de evento.');
                    await validateEvent(c,row.id_local,event);
                    await model.setEvent(c,id,event);
                }
                if(Object.keys(fields).length)await model.update(c,id,fields);
                await identity.audit(c, 'COMBO.CHANGED', id, context);
                return detail(id, c, true);
            });
        },
        async replace(id, input, context) {
            return transact(context, async c => {
                const initial = found(await model.combo(id, c));
                if (initial.id_local === null) throw conflict('Combo legado sem local requer saneamento');
                await validItems(c, initial.id_local, input.items);
                const row = found(await model.combo(id, c, true));
                if (row.id_local !== initial.id_local) throw conflict('Local alterado');
                if (!row.ativo || await model.referenced(id, c)) throw conflict('Combo arquivado ou referenciado não pode ter composição alterada');
                await model.replaceItems(c, id, input.items);
                await identity.audit(c, 'COMBO.COMPOSITION_CHANGED', id, context);
                return detail(id, c, true);
            });
        },
        async archive(id, context) {
            return transact(context, async c => {
                const row = found(await model.combo(id, c, true));
                if (!row.ativo) return;
                await model.update(c, id, { ativo: 0 });
                await identity.audit(c, 'COMBO.ARCHIVED', id, context);
            });
        }
    };
}
