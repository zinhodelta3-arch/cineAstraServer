
export function subscriptionInput(raw, create = false) {
 if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
 const keys = ['planId','period','autoRenew','divisionMode',...(create?['acceptance']:[])];
 if(Object.keys(raw).some(key=>!keys.includes(key)))return null;
 if(typeof raw.planId!=='string'||! /^[1-9]\d{0,9}$/.test(raw.planId)||BigInt(raw.planId)>4294967295n)return null;
 if(!['MENSAL','ANUAL'].includes(raw.period)||typeof raw.autoRenew!=='boolean'||raw.divisionMode!=='TITULAR_PAGA')return null;
 if(create && (!raw.acceptance || raw.acceptance.accepted!==true || typeof raw.acceptance.offerHash!=='string' || !/^[a-f0-9]{64}$/.test(raw.acceptance.offerHash) || Object.keys(raw.acceptance).some(k=>!['accepted','offerHash'].includes(k))))return null;
 return {planId:raw.planId,period:raw.period,autoRenew:raw.autoRenew,divisionMode:raw.divisionMode,...(create?{acceptance:{accepted:true,offerHash:raw.acceptance.offerHash}}:{})};
}
export const planMoney = value => value!=null && Number.isFinite(Number(value)) ? Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : 'Preço indisponível';
export function planBenefits(plan) {
 const labels={INGRESSO:'ingressos',BOMBONIERE:'bomboniere',STREAMING:'streaming',INPUT:'produtos',COMBO:'combos'};
 return [
  `Até ${plan.maxMembers} membro(s)`,
  ...(plan.catalogAccess?['Acesso ao catálogo de streaming']:[]),
  ...(plan.freeCombosPerMonth>0?[`${plan.freeCombosPerMonth} combo por mês, conforme contrato`]:[]),
  ...Object.entries(plan.discounts||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${Number(v)/100}% de desconto em ${labels[k]||k.toLowerCase()}`)
 ];
}
