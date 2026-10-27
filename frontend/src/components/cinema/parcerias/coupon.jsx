import Icon from "./icon";
import usePartnerCoupon from "@/hooks/cinema/parcerias/use-partner-coupon";

export default function Coupon({ benefit }) {
  const { codeRef, status, copyCode } = usePartnerCoupon(benefit.code);

  return <div className="ca-redeem">
    <span className="ca-category">{benefit.code ? 'Seu cupom de exemplo' : 'Como utilizar'}</span>
    {benefit.code ? <div className="ca-coupon"><code ref={codeRef}>{benefit.code}</code><button type="button" onClick={copyCode} aria-label={`Copiar cupom de demonstração ${benefit.brand}`}><Icon name="copy" /><span>Copiar</span></button></div> : <p className="ca-payment-note"><Icon name="ticket" />Pague com um cartão elegível do parceiro. Não precisa de cupom.</p>}
    {benefit.code && <p className="ca-copy-status" role="status">{status}</p>}
  </div>;
}
