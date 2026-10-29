import test from 'node:test';
import assert from 'node:assert/strict';
import {snackProduct} from '../src/lib/api/snack-products.mjs';
test('IDs do carrinho separam tipo e cinema sem perder IDs da API',()=>{
 const input=snackProduct({id:'5',name:'Pipoca',publishedPrice:'12.50',inStock:true},'INPUT','7');
 const combo=snackProduct({id_combo:'5',nome:'Combo',preco:'20.00',items:[{id_insumo:'5',quantidade:2}]},'COMBO','7');
 assert.notEqual(input.id,combo.id);assert.equal(input.sourceId,'5');assert.equal(input.localId,'7');assert.equal(input.purchaseKind,'INPUT');assert.equal(combo.inStock,null);assert.equal(combo.items.length,1);
 assert.notEqual(input.id,snackProduct({id:'5'},'INPUT','8').id);
});
test('estoque e preço publicado vêm do servidor; não inventa imagem de combo',()=>{
 const p=snackProduct({id:'2',name:'Água',publishedPrice:'3.00',inStock:false,imageUrl:'javascript:alert(1)'},'INPUT','7');
 assert.equal(p.inStock,false);assert.equal(p.price,'3.00');assert.equal(p.image,null);
});
