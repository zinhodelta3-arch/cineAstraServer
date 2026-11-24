import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { instant } from './identityService.js';
import { createHash } from 'node:crypto';

const date = value => value == null ? null : new Date(instant(value)).toISOString();
const page = (rows, q, key, map) => {
  const items = rows.slice(0, q.limit);
  return { items: items.map(map), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1)[key]) : null } };
};

const parse=value=>typeof value==='string'?JSON.parse(value):value;
const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
const conflict=message=>new ApiError(message,409,null,'ADMIN_SALES_CONFLICT');
const archiveStatus = {
  orders: ['PAGO','FINALIZADO','CANCELADO'],
  payments: ['APROVADO','RECUSADO','PARCIALMENTE_ESTORNADO','ESTORNADO'],
  refunds: ['CONFIRMADA','NEGADA','FALHOU','CANCELADA'],
};
const archiveAudit = {orders:'ORDER',payments:'PAYMENT',refunds:'REFUND'};
const pixResult = row => ({paymentId:idString(row.id_pagamento),orderId:idString(row.id_pedido),status:row.status,amount:String(row.valor)});

export function createSalesService({ model, identity, checkout, paymentService, simulatedPixEnabled }) {
  function adminTransaction(context, work) {
    return identity.transaction(async c => {
      const admin=await identity.activeActor(c,context);
      if(admin.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
      return work(c,admin);
    },context);
  }
  function validateDraft(draft) {
    const seen=new Set();
    for(const line of draft.lines) {
      if(line.kind==='STREAMING'&&line.mode!=='ALUGUEL')throw conflict('Filmes podem ser adicionados somente como aluguel.');
      if(line.kind==='COMBO'&&!line.sessionId)throw conflict('Informe a sessão de retirada do combo.');
      if(['INPUT','COMBO'].includes(line.kind)&&!draft.localId)throw conflict('Informe o cinema dos itens AstraSnack.');
      const key=`${line.kind}:${line.id}:${line.seatId??''}`;
      if(seen.has(key))throw conflict('Há itens repetidos na proposta.');
      seen.add(key);
    }
  }
  async function list(kind, q, context) {
    return adminTransaction(context,async c => {
      if (kind === 'orders') return page(await model.orders(c, q), q, 'id_pedido', row => ({
        id: idString(row.id_pedido), userId: idString(row.id_usuario), customer: row.cliente,
        status: row.status, total: String(row.valor_total), createdAt: date(row.data_pedido), draft:parse(row.proposta_admin)??null,
        archivedAt:date(row.arquivado_admin_em), canSimulatePix:Boolean(simulatedPixEnabled&&row.status==='AGUARDANDO_PAGAMENTO'&&row.checkout_expira_em&&instant(row.checkout_expira_em)>Date.now()),
        ...(row.cancelado_por_admin&&{cancellation:{adminId:idString(row.cancelado_por_admin),reason:row.motivo_cancelamento_admin}})
      }));
      return page(await model.payments(c, q), q, 'id_pagamento', row => ({
        id: idString(row.id_pagamento), orderId: row.id_pedido == null ? null : idString(row.id_pedido),
        chargeId: row.id_cobranca == null ? null : idString(row.id_cobranca), userId: idString(row.id_usuario),
        customer: row.cliente, method: row.metodo, amount: String(row.valor), status: row.status,
        createdAt: date(row.criado_em ?? row.data_pagamento), paidAt: date(row.data_pagamento), archivedAt:date(row.arquivado_admin_em),
        reconcilable:Boolean(row.provider)&&['PENDENTE','RECUSADO'].includes(row.status)
      }));
    });
  }
  return {
    list,
    archive:(kind,id,context)=>adminTransaction(context,async c=>{
      const row=found(await model.archivedRecord(c,kind,id));
      if(!row.arquivado_admin_em){
        if(!archiveStatus[kind].includes(row.status))throw conflict('Encerre a operação antes de arquivar este registro.');
        await model.archive(c,kind,id);
        await identity.audit(c,`${archiveAudit[kind]}.ARCHIVED_BY_ADMIN`,id,context);
      }
      return {id,archived:true};
    }),
    simulatePix:(id,key,context)=>adminTransaction(context,async(c,admin)=>{
      if(!simulatedPixEnabled)throw conflict('O Pix administrativo está disponível apenas no modo simulado.');
      const order=found(await model.order(c,id));
      const owner=idString(order.id_usuario);
      const internalKey=`admin-pix:${createHash('sha256').update(`${admin.id_usuario}:${id}:${key}`).digest('hex')}`;
      const previous=await model.simulatedPixByKey(c,owner,internalKey);
      if(previous)return pixResult(previous);
      if(order.arquivado_admin_em||!await checkout.ready(c,id,order))throw conflict('Selecione um pedido pendente com reserva vigente.');
      if(await model.unsettledIntent(c,id)||await model.blockingPayment(c,id)){
        throw conflict('Já existe um pagamento em andamento ou confirmado para este pedido. Consulte o pagamento antes de tentar novamente.');
      }
      await paymentService.settleCounter(c,{orderId:id,amount:String(order.valor_total),owner,key:internalKey,label:'Pix administrativo'},context);
      const result=await model.simulatedPixByKey(c,owner,internalKey);
      const settled=await model.order(c,id);
      if(result?.status!=='APROVADO'||settled.status!=='PAGO')throw conflict('Não foi possível confirmar o Pix simulado e concluir o pedido.');
      await identity.audit(c,'PAYMENT.ADMIN_SIMULATED_PIX_CREATED',result.id_pagamento,context);
      return pixResult(result);
    }),
    createDraft:({userId,draft},context)=>adminTransaction(context,async c=>{
      if(!await model.customer(c,userId))throw conflict('Selecione um cliente ativo.');
      validateDraft(draft);
      const orderId=await model.createDraft(c,userId,draft);
      await identity.audit(c,'ORDER.ADMIN_DRAFT_CREATED',orderId,context);
      return {orderId,status:'EM_ANDAMENTO'};
    }),
    updateDraft:(id,draft,context)=>adminTransaction(context,async c=>{
      const row=found(await model.order(c,id));
      if(row.status!=='EM_ANDAMENTO'||row.proposta_admin==null)throw conflict('Somente uma proposta ainda pendente pode ser editada.');
      validateDraft(draft);
      await model.updateDraft(c,id,draft);
      await identity.audit(c,'ORDER.ADMIN_DRAFT_UPDATED',id,context);
      return {orderId:id,status:row.status};
    }),
    async cancel(id,reason,context) {
      const draft=await adminTransaction(context,async (c,admin)=>{
        const row=found(await model.order(c,id));
        if(row.proposta_admin==null||!['EM_ANDAMENTO','CANCELADO'].includes(row.status))return null;
        if(row.status==='EM_ANDAMENTO'){
          await model.cancelDraft(c,id,admin.id_usuario,reason);
          await identity.audit(c,'ORDER.ADMIN_DRAFT_CANCELLED',id,context);
        }
        return {orderId:id,status:'CANCELADO'};
      });
      return draft??await checkout.cancelByAdmin(id,context,reason);
    },
    reconcile:(id,context)=>paymentService.reconcileByAdmin(id,context),
    paymentNotes:(id,context)=>adminTransaction(context,async c=>{
      found(await model.payment(c,id));
      return {items:(await model.paymentNotes(c,id)).map(row=>({id:idString(row.id_nota),adminId:idString(row.id_admin),note:row.nota,createdAt:date(row.criado_em)}))};
    }),
    addPaymentNote:(id,note,context)=>adminTransaction(context,async(c,admin)=>{
      found(await model.payment(c,id));
      await model.addPaymentNote(c,id,admin.id_usuario,note);
      await identity.audit(c,'PAYMENT.ADMIN_NOTE_ADDED',id,context);
      return {paymentId:id};
    })
  };
}
