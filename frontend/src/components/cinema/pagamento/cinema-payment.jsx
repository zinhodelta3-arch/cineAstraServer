"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CreditCard, QrCode } from "lucide-react";
import usePayment from "@/hooks/cinema/pagamento/use-payment";
import { useSession } from "@/hooks/auth/use-session";
import { Button } from "@/components/ui/button";
import PaymentDetails from "./payment-details";
import PaymentSummary from "./payment-summary";
import styles from "./payment.module.css";

const methods = [
  { slug: "debito", label: "Débito", icon: CreditCard, type: "DEBITO" },
  { slug: "pix", label: "Pix", icon: QrCode, type: "PIX" },
  { slug: "credito", label: "Crédito", icon: CreditCard, type: "CREDITO" },
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

function SavedPaymentPicker({ payment, pix = false }) {
  if (!payment.savedMethods.length) return null;
  return <label className={styles.field}>
    <span>{pix ? "Método Pix" : "Cartão para esta compra"}</span>
    <select value={payment.selectedMethodId} onChange={event => payment.selectMethod(event.target.value)} disabled={!payment.canChangeMethod}>
      {payment.savedMethods.map(item => <option key={item.id} value={item.id}>
        {item.identification || (pix ? "Pix salvo" : "Cartão salvo")}{item.principal ? " · Principal" : ""}
      </option>)}
      <option value="">{pix ? "Usar um novo Pix" : "Usar outro cartão"}</option>
    </select>
  </label>;
}

function PixPanel({ payment }) {
  return <section className={styles.pixPanel} aria-labelledby="pix-title">
    <h2 id="pix-title" className={styles.sectionTitle}>Pagamento via Pix</h2>
    <p className={styles.hint}>A aprovação do Pix é simulada após sua confirmação.</p>
    <SavedPaymentPicker payment={payment} pix />
    {!payment.result?.paymentId && <Button type="button" className="mt-5" onClick={payment.confirmPix} disabled={!payment.ready || payment.pending}>
      {payment.pending ? "Confirmando…" : payment.error ? "Tentar novamente" : "Confirmar Pix"}
    </Button>}
    {payment.error && <p role="alert" className={styles.error}>{payment.error}</p>}
    {payment.result && <div role="status" className={styles.paymentResult}>
      <strong>Pedido #{payment.result.orderId}</strong><span>Pagamento: {payment.result.status}</span><span>Pedido: {payment.result.orderStatus}</span>
      {["PAGO", "FINALIZADO"].includes(payment.result.orderStatus) ? <><Link href="/cinema/minhascompras">Ver meus pedidos e ingressos <ArrowRight size={15} /></Link><Link href="/cinema/astrasnack">Começar outro pedido AstraSnack <ArrowRight size={15} /></Link></> :
        payment.result.paymentId && <button type="button" className={styles.retryButton} disabled={payment.pending || payment.checkingPayment} onClick={() => payment.refreshPayment(payment.result.paymentId)}>Atualizar status</button>}
      {payment.pollingPaused && <p>As consultas automáticas foram pausadas. Use Atualizar status para consultar o pedido.</p>}
    </div>}
  </section>;
}

export default function CinemaPayment(props) {
  const { user, loading } = useSession();
  if (loading) return <main className="mx-auto w-full max-w-6xl p-8" role="status">Verificando sua conta…</main>;
  if (user?.role !== "CLIENTE") return <main className="mx-auto w-full max-w-6xl p-8">Entre com uma conta de cliente para pagar.{" "}<Link href={user ? "/cinema/carrinho" : "/auth/login?next=%2Fcinema%2Fcarrinho"} className="text-primary underline">{user ? "Voltar ao carrinho" : "Entrar"}</Link></main>;
  return <AccountPayment key={`${user.id}:${props.method ?? ""}:${props.draftId ?? ""}`} {...props} />;
}

function AccountPayment({ method = null, draftId = null }) {
  const payment = usePayment(method, draftId);
  const draftQuery = draftId ? `?draft=${draftId}` : "";
  const returnHref = draftId ? "/cinema/minhascompras" : "/cinema/carrinho";
  const isCard = method === "credito" || method === "debito";
  const principalType = payment.principalMethod?.type;
  const priority = methods.find(item => item.type === principalType);
  const sortedMethods = priority ? [priority, ...methods.filter(item => item !== priority)] : methods;
  return <main className={styles.page}>
    <div className={styles.container}>
      {(!method || payment.canChangeMethod) && <Link prefetch={false} href={method ? `/cinema/pagamento${draftQuery}` : returnHref} className={styles.back}><ArrowLeft size={16} aria-hidden="true" />{method ? "Trocar método de pagamento" : draftId ? "Voltar às compras" : "Voltar ao carrinho"}</Link>}
      <div className={styles.layout}>
        <div className={styles.primaryPanel}>
          {payment.walletError && <div role="alert" className={styles.error}>
            <p>{payment.walletError}</p>
            <Button type="button" variant="outline" className="mt-2" onClick={payment.retryWallet}>Tentar novamente</Button>
          </div>}
          {payment.walletLoading && <p className={styles.selectionHint} role="status">Consultando métodos salvos…</p>}
          {!method ? <>
            <h1 className={styles.pageTitle}>Selecione um método <span>de pagamento.</span></h1>
            <p className={styles.lead}>Escolha como deseja concluir sua compra.</p>
            <div className={styles.methodGrid}>
              {sortedMethods.map(({ slug, label, icon: Icon, type }) => <Link key={slug} prefetch={false} href={payment.ready ? `/cinema/pagamento/${slug}${draftQuery}` : "#payment-consent"} aria-disabled={!payment.ready} onClick={event => { if (!payment.ready) event.preventDefault(); }} className={`${styles.methodTicket} ${!payment.ready ? styles.methodDisabled : ""}`}>
                <Icon size={25} aria-hidden="true" /><strong>{label}</strong>
                {type === principalType && <span className="text-left text-xs font-semibold text-primary">Principal do perfil{type !== "PIX" && payment.principalMethod?.identification && <small className="mt-1 block text-muted-foreground">{payment.principalMethod.identification}</small>}</span>}
              </Link>)}
            </div>
            {!payment.walletLoading && !payment.walletError && !payment.ready && <p className={styles.selectionHint}>Revise o resumo e aceite a oferta para escolher um método.</p>}
          </> : isCard ? <>
            <h1 className={styles.pageTitle}>Cartão de <span>{method === "debito" ? "débito" : "crédito"}.</span></h1>
            <p className={styles.lead}>{payment.savedMethod ? "Confira o cartão selecionado antes de pagar." : "Confira os dados do cartão e do titular antes de pagar."}</p>
            <form id="payment-card-form" onSubmit={payment.confirmCard} className={styles.cardForm}>
              <SavedPaymentPicker payment={payment} />
              {payment.newCard && <fieldset className={styles.cardFields} disabled={!payment.canChangeMethod}>
                <CardFields card={payment.card} changeCard={payment.changeCard} />
                <div className={styles.formDivider} />
                {payment.profileLoading && <p className={styles.hint} role="status">Consultando dados do perfil…</p>}
                {payment.profileIncomplete && <p className={styles.hint}>Preencha os campos que ficaram em branco.</p>}
                <PaymentDetails details={payment.details} onChange={payment.changeDetail} cepStatus={payment.cepStatus} />
              </fieldset>}
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
