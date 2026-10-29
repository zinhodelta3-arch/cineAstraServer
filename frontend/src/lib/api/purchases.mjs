export const validOrderId=value=>typeof value==='string'&&/^[1-9]\d{0,19}$/.test(value)&&BigInt(value)<=18446744073709551615n;
export function purchaseTarget(parts=[],cursor=null){
 if(cursor!==null&&!validOrderId(cursor))return null;
 const page='?limit=20'+(cursor?'&cursor='+cursor:'');
 if(!parts.length)return '/orders'+page;
 if(!validOrderId(parts[0]))return null;
 if(parts.length===1)return '/orders/'+parts[0];
 if(parts.length===2&&parts[1]==='tickets')return '/orders/'+parts[0]+'/tickets'+page;
 if(parts.length===2&&parts[1]==='receipt')return '/orders/'+parts[0]+'/receipt';
 return null;
}
export function publicReceipt(data){
 const c=data.contract,offer=c?.offer;
 if(!offer||!Array.isArray(offer.lines))throw new Error('Contrato inválido.');
 return {orderId:data.orderId,acceptedAt:data.acceptedAt,offerHash:data.offerHash,
  contract:{business:c.business,terms:c.terms,privacy:c.privacy,offer:{total:offer.total,fees:offer.fees,currency:offer.currency,conditions:offer.conditions,
   lines:offer.lines.map(line=>({category:line.category,id:line.id,quantity:line.quantity,unitPrice:line.unitPrice,subtotal:line.subtotal}))}}};
}
export const orderStatuses={EM_ANDAMENTO:'Em andamento',AGUARDANDO_PAGAMENTO:'Aguardando pagamento',PAGO:'Pago',FINALIZADO:'Finalizado',CANCELADO:'Cancelado'};
export const itemTypes={SESSION:'Sessão',INPUT:'Produto',COMBO:'Combo',RENTAL:'Aluguel de filme',PURCHASE:'Compra de filme',INGRESSO_SESSAO:'Ingresso de sessão',RETIRADA_INSUMO:'Retirada de produto',ACESSO_STREAMING:'Acesso ao streaming'};
export const ticketStatuses={GERADO:'Gerado',UTILIZADO:'Utilizado',CANCELADO:'Cancelado',EXPIRADO:'Expirado'};
export const purchaseMoney=v=>v!=null&&Number.isFinite(Number(v))?Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'Valor indisponível';
export function purchaseDate(v){
 if(!v)return 'Data não informada';
 const date=new Date(v);return Number.isNaN(date.getTime())?'Data não informada':date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
}
export function purchaseSummary(order,detail,receipt){
 return ['CineAstra — resumo do pedido (sem valor fiscal)', 'Pedido #'+order.orderId,
 'Data: '+purchaseDate(order.createdAt)+' (Brasília)','Estado: '+(orderStatuses[detail.financialStatus]||detail.financialStatus),
 'Total do pedido: '+purchaseMoney(order.total),
 ...(receipt?['Contrato aceito em: '+purchaseDate(receipt.acceptedAt),...receipt.contract.offer.lines.map(line=>(itemTypes[line.category]||line.category)+' #'+line.id+' · '+line.quantity+' × '+purchaseMoney(line.unitPrice)+' = '+purchaseMoney(line.subtotal))]:[]),
 'Cancelamento não comprova estorno. Consulte o estado do pagamento com o suporte.'].join('\n');
}
