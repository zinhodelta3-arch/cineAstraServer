const id=v=>typeof v==='string'&&/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n;
export function cartOrder(items,coupon=''){
 if(!Array.isArray(items)||!items.length)throw new Error('Adicione produtos ao carrinho.');
 const lines=new Map();let localId;
 for(const item of items){
  if(!id(item.localId)||!id(item.sourceId)||!['INPUT','COMBO'].includes(item.purchaseKind))throw new Error('Há itens antigos ou ingressos ainda não integrados. Remova-os e adicione produtos pelo AstraSnack.');
  if(localId&&localId!==item.localId)throw new Error('Escolha produtos de um único cinema para este pedido.');
  localId=item.localId;
  if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>100)throw new Error('Use quantidades inteiras entre 1 e 100.');
  const key=item.purchaseKind+':'+item.sourceId,quantity=(lines.get(key)?.quantity||0)+item.quantity;
  if(quantity>100)throw new Error('O limite por produto é de 100 unidades.');
  lines.set(key,{kind:item.purchaseKind,id:item.sourceId,quantity});
 }
 const couponCode=coupon.trim().toUpperCase();
 if(couponCode&&!/^[A-Z0-9_-]{1,50}$/.test(couponCode))throw new Error('Cupom inválido. Use até 50 letras, números, hífen ou sublinhado.');
 if(lines.size>50)throw new Error('O limite é de 50 produtos diferentes por pedido.');
 return {localId,lines:[...lines.values()],...(couponCode?{couponCode}:{})};
}
export function validCartOrder(body){
 if(!body||typeof body!=='object'||Object.keys(body).some(k=>!['localId','lines','couponCode'].includes(k))||!id(body.localId)||!Array.isArray(body.lines)||!body.lines.length||body.lines.length>50)return false;
 const seen=new Set();
 for(const line of body.lines){
  if(!line||Object.keys(line).some(k=>!['kind','id','quantity'].includes(k))||!id(line.id)||!['INPUT','COMBO'].includes(line.kind)||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>100)return false;
  const key=line.kind+':'+line.id;if(seen.has(key))return false;seen.add(key);
 }
 return body.couponCode===undefined||typeof body.couponCode==='string'&&/^[A-Z0-9_-]{1,50}$/.test(body.couponCode);
}
