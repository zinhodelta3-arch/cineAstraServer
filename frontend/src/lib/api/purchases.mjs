export const validOrderId=value=>typeof value==='string'&&/^[1-9]\d{0,19}$/.test(value)&&BigInt(value)<=18446744073709551615n;
export function purchaseTarget(parts=[],cursor=null){
 if(cursor!==null&&!validOrderId(cursor))return null;
 const page='?limit=20'+(cursor?'&cursor='+cursor:'');
 if(!parts.length)return '/orders'+page;
 if(parts[0]==='refunds'&&parts.length===2&&validOrderId(parts[1])&&cursor===null)return '/refunds/'+parts[1];
 if(!validOrderId(parts[0]))return null;
 if(parts.length===1)return '/orders/'+parts[0];
 if(parts.length===2&&parts[1]==='tickets')return '/orders/'+parts[0]+'/tickets'+page;
 if(parts.length===2&&parts[1]==='refunds')return '/orders/'+parts[0]+'/refunds'+page;
 if(parts.length===2&&parts[1]==='receipt')return '/orders/'+parts[0]+'/receipt';
 if(parts.length===2&&parts[1]==='pdf'&&cursor===null)return '/orders/'+parts[0]+'/purchase-document';
 if(parts.length===2&&parts[1]==='draft')return '/orders/'+parts[0]+'/draft';
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
export const purchasePaymentStatuses={APROVADO:'Pagamento confirmado',PARCIALMENTE_ESTORNADO:'Pagamento estornado em parte',ESTORNADO:'Pagamento estornado'};
export const purchaseDocumentStatus = document => document.status==='CANCELADO' ? 'Pedido cancelado'
 : purchasePaymentStatuses[document.payment?.status] ?? orderStatuses[document.status] ?? 'Situação indisponível';
export const purchaseDocumentTotalLabel = document => document.payment?.status==='APROVADO' && document.status!=='CANCELADO' ? 'Total pago' : 'Total do pedido';
export const purchasePaymentMethods={PIX:'Pix',CREDITO:'Cartão de crédito',DEBITO:'Cartão de débito',BOLETO:'Boleto'};
export function purchaseItemLabel(item){
 if(item.kind==='SESSION')return ({MEIA:'Ingresso meia-entrada',INTEIRA:'Ingresso inteiro',ISENTA:'Ingresso isento'})[item.admission]??'Ingresso';
 return item.name || itemTypes[item.kind] || 'Item do pedido';
}
export function purchaseSessionDate(session) {
 const date=typeof session?.date==='string'?session.date.slice(0,10).split('-').reverse().join('/'):null;
 const time=typeof session?.time==='string'?session.time.slice(0,5).replace(':','h'):null;
 return [date,time].filter(Boolean).join(' às ');
}
