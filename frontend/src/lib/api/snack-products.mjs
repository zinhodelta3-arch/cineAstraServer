import {publicAsset} from './public-api.mjs';
export function snackProduct(row,kind,localId){
 const combo=kind==='COMBO',sourceId=String(combo?row.id_combo:row.id);
 const main = publicAsset(combo ? row.imagem : row.imageUrl);
 const alternate = publicAsset(combo ? row.imagem_alternativa : row.alternateImageUrl);
 return {id:`${localId}:${kind}:${sourceId}`,sourceId,localId:String(localId),purchaseKind:kind,type:'snack',name:combo?row.nome:row.name,description:(combo?row.descricao:row.description)||'',price:combo?row.preco:row.publishedPrice,image:main ?? alternate,alternateImage:main && alternate !== main ? alternate : null,category:row.event?'Combo temático':combo?'Combos':row.category||'Produtos avulsos',categoryId:kind,inStock:combo?(row.inStock??null):row.inStock===true,items:combo?row.items||[]:[],...(row.event && {eventSessionId:row.event.sessionId,customerLimit:row.event.customerLimit})};
}
