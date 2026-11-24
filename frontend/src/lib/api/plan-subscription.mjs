
export const planModalities = [
 { id: 'INDIVIDUAL', name: 'Individual', members: 1 },
 { id: 'DUPLA', name: 'Dupla', members: 2 },
 { id: 'FAMILIA', name: 'Família', members: 4 }
];
export const planModality = value => planModalities.find(option => option.id === value)?.name ?? null;

export function subscriptionInput(raw, create = false, existingDivision = false) {
 if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
 const keys = ['planId','period','modality','autoRenew','divisionMode',...(create?['acceptance']:[])];
 if(Object.keys(raw).some(key=>!keys.includes(key)))return null;
 if(typeof raw.planId!=='string'||! /^[1-9]\d{0,9}$/.test(raw.planId)||BigInt(raw.planId)>4294967295n)return null;
 if(!['MENSAL','ANUAL'].includes(raw.period)||typeof raw.autoRenew!=='boolean'||!['TITULAR_PAGA','DIVISAO_IGUAL'].includes(raw.divisionMode))return null;
 if(raw.modality!==undefined&&!planModality(raw.modality))return null;
 if(!existingDivision&&(raw.modality??'INDIVIDUAL')==='INDIVIDUAL'&&raw.divisionMode==='DIVISAO_IGUAL')return null;
 if(create && (!raw.acceptance || raw.acceptance.accepted!==true || typeof raw.acceptance.offerHash!=='string' || !/^[a-f0-9]{64}$/.test(raw.acceptance.offerHash) || Object.keys(raw.acceptance).some(k=>!['accepted','offerHash'].includes(k))))return null;
 return {planId:raw.planId,period:raw.period,...(raw.modality&&{modality:raw.modality}),autoRenew:raw.autoRenew,divisionMode:raw.divisionMode,...(create?{acceptance:{accepted:true,offerHash:raw.acceptance.offerHash}}:{})};
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
export const planDiscountLabels = {
 SESSION: 'ingressos', INPUT: 'produtos do AstraSnack', COMBO: 'combos',
 RENTAL: 'aluguéis de filmes', PURCHASE: 'compras de filmes'
};
const discountPercent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
export function planBenefitRows(plan) {
 const count = Number(plan.freeCombosPerMonth);
 return [
  { label: 'Catálogo de streaming', included: plan.catalogAccess === true },
  { label: count > 1 ? `${count} combos grátis por mês` : 'Combo grátis mensal', included: count > 0 && Boolean(plan.freeComboId) },
  ...Object.entries(planDiscountLabels).map(([key, name]) => {
   const bps = Number(plan.discounts?.[key] ?? 0);
   return {
    label: bps > 0 ? `${discountPercent.format(bps / 100)}% de desconto em ${name}` : `Desconto em ${name}`,
    included: bps > 0
   };
  })
 ];
}
export function planBenefits(plan) {
 return planBenefitRows(plan).filter(benefit => benefit.included).map(benefit => benefit.label);
}
