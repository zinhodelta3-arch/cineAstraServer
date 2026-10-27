import {idString,moneyString} from '../utils/dto.js';
import {ApiError} from '../utils/ApiError.js';
const dto=r=>({id:idString(r.id_insumo),localId:idString(r.id_local),name:r.nome,description:r.descricao??null,category:r.categoria??null,publishedPrice:moneyString(r.preco),currency:'BRL',inStock:Boolean(r.em_estoque),imageUrl:r.imagem??null,purchaseKind:'INPUT'});
export function createSnackCatalogService({model}){return {
    async list(localId,q){const rows=await model.list(localId,q),page=rows.slice(0,q.limit);return {items:page.map(dto),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?idString(page.at(-1).id_insumo):null}};},
    async get(localId,id){const row=await model.get(localId,id);if(!row)throw ApiError.naoEncontrado();return dto(row);}
};}
