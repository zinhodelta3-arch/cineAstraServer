"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CreditCard, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import usePayment from "@/hooks/cinema/pagamento/use-payment";
import PaymentDetails from "./payment-details";
import PaymentSummary from "./payment-summary";
import styles from "./payment.module.css";

const methods = [
  { slug: "debito", label: "Débito", icon: CreditCard },
  { slug: "pix", label: "Pix", icon: QrCode },
  { slug: "credito", label: "Crédito", icon: CreditCard },
];

function CardFields({ card, changeCard }) {
  return <section aria-labelledby="card-fields-title">
    <h2 id="card-fields-title" className={styles.sectionTitle}>Dados do cartão</h2>
    <p className={styles.hint}>O número completo e o código de segurança não são enviados ao servidor.</p>
    <div className={styles.fields}>
      <label className={styles.field}><span>Nome no cartão</span><input name="holder" autoComplete="off" required maxLength={80} value={card.holder} onChange={changeCard} placeholder="NOME DE EXEMPLO" /></label>
      <label className={styles.field}><span>Número do cartão</span><input name="number" autoComplete="off" inputMode="numeric" required maxLength={19} pattern="[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}" value={card.number} onChange={changeCard} placeholder="0000 0000 0000 0000" /></label>
      <label className={styles.field}><span>Validade</span><input name="expiry" autoComplete="off" inputMode="numeric" required maxLength={5} pattern="(0[1-9]|1[0-2])/[0-9]{2}" value={card.expiry} onChange={changeCard} placeholder="MM/AA" /></label>
      <label className={styles.field}><span>Código de segurança</span><input name="cvv" autoComplete="off" inputMode="numeric" required minLength={3} maxLength={4} pattern="[0-9]{3,4}" value={card.cvv} onChange={changeCard} placeholder="000" /></label>
    </div>
  </section>;
}

function PixPanel({ payment }) {
  return <section className={styles.pixPanel} aria-labelledby="pix-title">
    <h2 id="pix-title" className={styles.sectionTitle}>Pagamento via Pix</h2>
    <p className={styles.hint}>Aponte a câmera para o QR code.</p>
    <div className={styles.qrFrame}><QRCodeSVG value="https://www.pudim.com.br/" size={208} marginSize={0} bgColor="#ffffff" fgColor="#151515" title="QR code para Pix" /></div>
    {payment.ready && !payment.result?.paymentId && <p className={styles.pixTimer} role="status">{payment.pending ? "Confirmando pagamento…" : payment.remaining > 0 ? `Aprovação automática em ${payment.remaining} s` : "Preparando aprovação…"}</p>}
    {!payment.ready && !payment.result?.paymentId && <p role="alert" className={styles.error}>Volte à seleção, confira a oferta e aceite os termos para iniciar a contagem.</p>}
    {payment.error && <p role="alert" className={styles.error}>{payment.error}</p>}
    {payment.error && payment.remaining === 0 && !payment.result?.paymentId && <button type="button" className={styles.retryButton} onClick={payment.retryPix} disabled={payment.pending}>Tentar novamente</button>}
    {payment.result && <div role="status" className={styles.paymentResult}>
      <strong>Pedido #{payment.result.orderId}</strong><span>Pagamento: {payment.result.status}</span><span>Pedido: {payment.result.orderStatus}</span>
      {["PAGO", "FINALIZADO"].includes(payment.result.orderStatus) ? <Link href="/cinema/minhascompras">Ver meus pedidos e ingressos <ArrowRight size={15} /></Link> :
        payment.result.paymentId && <button type="button" className={styles.retryButton} disabled={payment.pending || payment.checkingPayment} onClick={() => payment.refreshPayment(payment.result.paymentId)}>Atualizar status</button>}
      {payment.pollingPaused && <p>As consultas automáticas foram pausadas. Use Atualizar status para consultar o pedido.</p>}
    </div>}
  </section>;
}

export default function CinemaPayment({ method = null, draftId = null }) {
  const payment = usePayment(method, draftId);
  const draftQuery = draftId ? `?draft=${draftId}` : "";
  const returnHref = draftId ? "/cinema/minhascompras" : "/cinema/carrinho";
  const isCard = method === "credito" || method === "debito";
  return <main className={styles.page}>
    <div className={styles.container}>
      <Link href={method ? `/cinema/pagamento${draftQuery}` : returnHref} className={styles.back}><ArrowLeft size={16} />{method ? "Voltar aos métodos" : draftId ? "Voltar às compras" : "Voltar ao carrinho"}</Link>
      <div className={styles.layout}>
        <div className={styles.primaryPanel}>
          {!method ? <>
            <h1 className={styles.pageTitle}>Selecione um método <span>de pagamento.</span></h1>
            <p className={styles.lead}>Escolha como deseja concluir sua compra.</p>
            <div className={styles.methodGrid}>
              {methods.map(({ slug, label, icon: Icon }) => <Link key={slug} href={payment.ready ? `/cinema/pagamento/${slug}${draftQuery}` : "#payment-consent"} aria-disabled={!payment.ready} onClick={event => { if (!payment.ready) event.preventDefault(); }} className={`${styles.methodTicket} ${!payment.ready ? styles.methodDisabled : ""}`}>
                <Icon size={25} aria-hidden="true" /><strong>{label}</strong>
              </Link>)}
            </div>
            {!payment.ready && <p className={styles.selectionHint}>Revise o resumo e aceite a oferta para escolher um método.</p>}
          </> : isCard ? <>
            <h1 className={styles.pageTitle}>Cartão de <span>{method === "debito" ? "débito" : "crédito"}.</span></h1>
            <p className={styles.lead}>Informe os dados do cartão para continuar.</p>
            <form id="payment-card-form" onSubmit={payment.confirmCard} className={styles.cardForm}>
              <CardFields card={payment.card} changeCard={payment.changeCard} />
              <div className={styles.formDivider} />
              <PaymentDetails details={payment.details} onChange={payment.changeDetail} cepStatus={payment.cepStatus} />
            </form>
          </> : <>
            <h1 className={styles.pageTitle}>Pague com <span>Pix.</span></h1>
            <PixPanel payment={payment} />
          </>}
        </div>
        <PaymentSummary payment={payment} method={method} draftId={draftId} />
      </div>
    </div>
  </main>;
}
