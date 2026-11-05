const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const labels={PROMOTION:'Promoção',SUBSCRIPTION:'Benefício da assinatura',COUPON:'Cupom',COMBO:'Desconto do combo'};
export default function ProductPrice({price,originalPrice,discountSources=[],note}){
 const discounted=Number.isFinite(Number(originalPrice))&&Number(originalPrice)>Number(price);
 return <span className="block space-y-1">
  {discounted&&<span className="block text-xs text-muted-foreground"><span className="sr-only">De </span><s>{currency.format(Number(originalPrice))}</s></span>}
  <strong className="block font-black">{discounted&&<span className="sr-only">Por </span>}{currency.format(Number(price))}</strong>
  {discounted&&<span className="block text-xs font-semibold text-primary">{(Array.isArray(discountSources)?discountSources:[]).map(source=>labels[source]).filter(Boolean).join(' · ')||'Desconto aplicado'}</span>}
  {note&&<span className="block text-xs text-muted-foreground">{note}</span>}
 </span>;
}
