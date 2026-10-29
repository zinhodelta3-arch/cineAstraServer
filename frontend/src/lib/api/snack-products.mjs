import {publicAsset} from './public-api.mjs';
export function snackProduct(row,kind,localId){
 const combo=kind==='COMBO',sourceId=String(combo?row.id_combo:row.id);
 return {id:`${localId}:${kind}:${sourceId}`,sourceId,localId:String(localId),purchaseKind:kind,type:'snack',name:combo?row.nome:row.name,description:(combo?row.descricao:row.description)||'',price:combo?row.preco:row.publishedPrice,image:combo?null:publicAsset(row.imageUrl),category:combo?'Combos':row.category||'Produtos avulsos',categoryId:kind,inStock:combo?null:row.inStock===true,items:combo?row.items||[]:[]};
}
