import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseTarget,publicReceipt,purchaseSummary} from '../src/lib/api/purchases.mjs';
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
 const summary=purchaseSummary({orderId:'1',total:'20.00'},{financialStatus:'CANCELADO'},null);
 assert.match(summary,/Cancelado/);assert.match(summary,/não comprova estorno/);assert.doesNotMatch(summary,/Total pago|Total estornado/);
});
