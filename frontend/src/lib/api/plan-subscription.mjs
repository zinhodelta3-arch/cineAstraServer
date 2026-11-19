
export function subscriptionInput(raw, create = false, existingDivision = false) {
 if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
 const keys = ['planId','period','autoRenew','divisionMode',...(create?['acceptance']:[])];
 if(Object.keys(raw).some(key=>!keys.includes(key)))return null;
 if(typeof raw.planId!=='string'||! /^[1-9]\d{0,9}$/.test(raw.planId)||BigInt(raw.planId)>4294967295n)return null;
 if(!['MENSAL','ANUAL'].includes(raw.period)||typeof raw.autoRenew!=='boolean'||!(raw.divisionMode==='TITULAR_PAGA'||existingDivision&&raw.divisionMode==='DIVISAO_IGUAL'))return null;
 if(create && (!raw.acceptance || raw.acceptance.accepted!==true || typeof raw.acceptance.offerHash!=='string' || !/^[a-f0-9]{64}$/.test(raw.acceptance.offerHash) || Object.keys(raw.acceptance).some(k=>!['accepted','offerHash'].includes(k))))return null;
 return {planId:raw.planId,period:raw.period,autoRenew:raw.autoRenew,divisionMode:raw.divisionMode,...(create?{acceptance:{accepted:true,offerHash:raw.acceptance.offerHash}}:{})};
}
export const planMoney = value => value!=null && Number.isFinite(Number(value)) ? Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : 'Preço indisponível';
const planDateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle:'long', timeZone:'UTC' });
export function planDate(value, nextDay = false) {
 const time = Date.parse(`${value?.slice(0, 10)}T00:00:00Z`);
 return Number.isFinite(time) ? planDateFormatter.format(time + (nextDay ? 86400000 : 0)) : null;
}
export const planPeriod = value => value === 'ANUAL' || value === 'annual' ? 'Anual' : 'Mensal';
export const planStatus = item => item.suspended || item.status === 'SUSPENSA' ? 'Acesso suspenso'
 : ({ ATIVA: 'Ativa', PENDENTE: 'Aguardando pagamento', CANCELADA: 'Cancelada', EXPIRADA: 'Expirada' }[item.status] ?? item.status);
export function planBenefits(plan) {
 const labels={SESSION:'ingressos',INGRESSO:'ingressos',BOMBONIERE:'bomboniere',STREAMING:'streaming',INPUT:'produtos',COMBO:'combos',RENTAL:'aluguéis de filmes',PURCHASE:'compras de filmes'};
 return [
  plan.maxMembers===1?'Apenas o titular':`Até ${plan.maxMembers} pessoas, incluindo o titular`,
  ...(plan.catalogAccess?['Acesso ao catálogo de streaming']:[]),
  ...(plan.freeCombosPerMonth>0?[`${plan.freeCombosPerMonth} combo por mês, conforme contrato`]:[]),
  ...Object.entries(plan.discounts||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${Number(v)/100}% de desconto em ${labels[k]||k.toLowerCase()}`)
 ];
}
