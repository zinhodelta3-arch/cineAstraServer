import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseTarget,publicReceipt,purchaseDocumentStatus,purchaseDocumentTotalLabel} from '../src/lib/api/purchases.mjs';
import {clientLoginDestination} from '../src/lib/auth/destination.mjs';
test('read proxy scopes resources and validates bigint IDs without precision loss',()=>{
 assert.equal(purchaseTarget(['18446744073709551615','tickets'],'20'),'/orders/18446744073709551615/tickets?limit=20&cursor=20');
 for(const p of [['18446744073709551616'],['..','admin'],['1','cancel'],['1','payments']])assert.equal(purchaseTarget(p),null);
 assert.equal(purchaseTarget([], '0'),null);
});
test('receipt removes internal costs and pricing parameters',()=>{
 const receipt=publicReceipt({orderId:'1',contract:{offer:{total:'20.00',fees:'0.00',lines:[{id:'3',category:'SESSION',quantity:1,unitPrice:'20.00',subtotal:'20.00',cost:'1.00',parameters:{secret:1}}]}}});
 assert.equal(receipt.contract.offer.lines[0].cost,undefined);
 assert.equal(receipt.contract.offer.lines[0].parameters,undefined);
 assert.equal(receipt.contract.offer.lines[0].unitPrice,'20.00');
});
test('download labels cancellation without claiming refunded money',()=>{
 const document={status:'CANCELADO',payment:{status:'APROVADO'}};
 assert.equal(purchaseDocumentStatus(document),'Pedido cancelado');
 assert.equal(purchaseDocumentTotalLabel(document),'Total do pedido');
});
test('PDF gateway and sign-in return accept only a matching document path',()=>{
 assert.equal(purchaseTarget(['18446744073709551615','pdf']),'/orders/18446744073709551615/purchase-document');
 assert.equal(purchaseTarget(['1','pdf'],'2'),null);
 const path='/cinema/comprovante?referencia=CA-12-12AB34-567890-ABCDEF-A123C4';
 assert.equal(clientLoginDestination(path),path);
 assert.equal(clientLoginDestination(path+'&next=/admin'),null);
});
