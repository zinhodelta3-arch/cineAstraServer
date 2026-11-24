import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message, 409, null, 'SUPPLIER_CONFLICT');
const adminDto = row => ({ id_fornecedor: idString(row.id_fornecedor), id_usuario: idString(row.id_usuario),
    id_empresa:row.id_empresa==null?null:idString(row.id_empresa), email:row.email??null,
    razao_social: row.razao_social, nome_cine: row.nome_cine ?? null, cnpj: row.cnpj, status: row.status, data_cadastro: row.data_cadastro });
const companyDto = row => ({ id_empresa:idString(row.id_empresa), razao_social:row.razao_social,nome_cine:row.nome_cine??null,cnpj:row.cnpj });
const selfDto = row => ({ id_fornecedor: idString(row.id_fornecedor), razao_social: row.razao_social, nome_cine: row.nome_cine ?? null, cnpj_ultimos4: row.cnpj.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-4), status: row.status });
export function createSupplierService({ model, identity }) {
    async function admin(c, context) {
        if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
    }
    async function transact(context, action) {
        try { return await identity.transaction(async c => { await admin(c, context); return action(c); }, context); }
        catch (error) { if (error.code === 'ER_DUP_ENTRY') throw conflict('Conta ou CNPJ já vinculado a fornecedor'); throw error; }
    }
    async function eligibleUser(c, id) {
        const row = found(await model.user(id, c, true));
        if (row.tipo_usuario !== 'FORNECEDOR' || row.status !== 'ATIVO') throw conflict('Conta FORNECEDOR ativa obrigatória');
    }
    return {
        companies:(q,context)=>transact(context,async c=>{
            const rows=await model.companies(c,q),items=rows.slice(0,q.limit).map(companyDto);
            return {items,pagination:{limit:q.limit,nextCursor:rows.length>q.limit?items.at(-1).id_empresa:null}};
        }),
        companyCreate:(input,context)=>transact(context,async c=>{
            const id=await model.createCompany(c,input);
            await identity.audit(c,'SUPPLY.COMPANY_CREATED',id,context);
            return companyDto(found(await model.company(c,id)));
        }),
        companyPatch:(id,input,context)=>transact(context,async c=>{
            found(await model.company(c,id,true));
            await model.updateCompany(c,id,{...input,nome_cine:input.nome_cine??null});
            await identity.audit(c,'SUPPLY.COMPANY_CHANGED',id,context);
            return companyDto(found(await model.company(c,id)));
        }),
        async list(q, context) {
            if (context.actor.tipo !== 'ADMIN') throw ApiError.acessoNegado();
            const rows = await model.list(q), items = rows.slice(0, q.limit);
            return { items: items.map(adminDto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_fornecedor) : null } };
        },
        async get(id, context) {
            if (context.actor.tipo !== 'ADMIN') throw ApiError.acessoNegado();
            return adminDto(found(await model.supplier(id)));
        },
        async me(context) {
            if (context.actor.tipo !== 'FORNECEDOR') throw ApiError.acessoNegado();
            return selfDto(found(await model.byUser(context.actor.id)));
        },
        async create(input, context) {
            return transact(context, async c => {
                await eligibleUser(c, input.userId);
                if (await model.byUser(input.userId, c)) throw conflict('Conta já vinculada a fornecedor');
                const company=found(await model.company(c,input.companyId,true));
                const id = await model.create(c, input.userId, company);
                await identity.audit(c, 'SUPPLIER.CREATED', id, context);
                return adminDto(found(await model.supplier(id, c)));
            });
        },
        async patch(id, input, context) {
            return transact(context, async c => {
                const company=input.companyId?found(await model.company(c,input.companyId,true)):null;
                const supplier = found(await model.supplier(id, c, true));
                if (input.status === 'ATIVO') await eligibleUser(c, supplier.id_usuario);
                await model.update(c, id, {
                    ...(input.status && {status:input.status}),
                    ...(company && {id_empresa:company.id_empresa,razao_social:company.razao_social,nome_cine:company.nome_cine??null,cnpj:company.cnpj})
                });
                await identity.audit(c, 'SUPPLIER.CHANGED', id, context);
                return adminDto(found(await model.supplier(id, c)));
            });
        },
        async archive(id, context) {
            return transact(context, async c => {
                const supplier = found(await model.supplier(id, c, true));
                if (supplier.status === 'INATIVO') return;
                await model.update(c, id, { status: 'INATIVO' });
                await identity.audit(c, 'SUPPLIER.ARCHIVED', id, context);
            });
        }
    };
}
