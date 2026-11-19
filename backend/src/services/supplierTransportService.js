import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
const transportTypes = ['Carro', 'Moto', 'Van', 'Furgão', 'Utilitário', 'Caminhão', 'Caminhão refrigerado', 'Outro'];
function transportType(input) {
    const type = transportTypes.find(value => value.localeCompare(input, 'pt-BR', { sensitivity: 'base' }) === 0);
    if (!type) throw new ApiError('Selecione um tipo de transporte da lista.', 422, null, 'TRANSPORT_TYPE_INVALID');
    return type;
}
const dto=row=>({
    ...row,id_transporte:idString(row.id_transporte),id_fornecedor:idString(row.id_fornecedor),
    id_entrega_ativa:row.id_entrega_ativa==null?null:idString(row.id_entrega_ativa),
    em_uso:row.id_entrega_ativa!=null,
});
export function createSupplierTransportService({model,identity}) {
    async function transaction(context,write,work) {
        return identity.transaction(async c=>{
            const actor=await identity.activeActor(c,context);
            if(actor.tipo_usuario!=='FORNECEDOR')throw ApiError.acessoNegado();
            const supplier=await model.supplier(c,actor.id_usuario,write);
            if(!supplier||supplier.status!=='ATIVO')throw ApiError.acessoNegado();
            try { return await work(c,idString(supplier.id_fornecedor)); }
            catch(error) {
                if(error.code==='ER_DUP_ENTRY')throw new ApiError('Já existe um transporte com essa identificação neste fornecedor.',409,null,'SUPPLIER_TRANSPORT_CONFLICT');
                throw error;
            }
        },context);
    }
    return {
        list:(q,context)=>transaction(context,false,async(c,supplierId)=>{
            const rows=await model.list(c,supplierId,q),items=rows.slice(0,q.limit).map(dto);
            return {items,types:transportTypes,pagination:{limit:q.limit,nextCursor:rows.length>q.limit?items.at(-1).id_transporte:null}};
        }),
        get:(id,context)=>transaction(context,false,async(c,supplierId)=>dto(found(await model.get(c,supplierId,id)))),
        create:(input,context)=>transaction(context,true,async(c,supplierId)=>{
            const id=await model.create(c,supplierId,{ ...input, tipo: transportType(input.tipo) });
            await identity.audit(c,'SUPPLIER_TRANSPORT.CREATED',id,context);
            return dto(found(await model.get(c,supplierId,id)));
        }),
        patch:(id,input,context)=>transaction(context,true,async(c,supplierId)=>{
            const current=found(await model.get(c,supplierId,id,true));
            if (input.tipo !== undefined && input.tipo !== current.tipo) input = { ...input, tipo: transportType(input.tipo) };
            await model.update(c,supplierId,id,input);
            await identity.audit(c,'SUPPLIER_TRANSPORT.CHANGED',id,context);
            return dto(found(await model.get(c,supplierId,id)));
        }),
        archive:(id,context)=>transaction(context,true,async(c,supplierId)=>{
            const row=found(await model.get(c,supplierId,id,true));
            if(row.status==='INATIVO')return;
            await model.update(c,supplierId,id,{status:'INATIVO'});
            await identity.audit(c,'SUPPLIER_TRANSPORT.ARCHIVED',id,context);
        })
    };
}
