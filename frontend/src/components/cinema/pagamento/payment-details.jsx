import styles from "./payment.module.css";

export default function PaymentDetails({ details, onChange, cepStatus }) {
  return <section aria-labelledby="payment-details-title">
    <h2 id="payment-details-title" className={styles.sectionTitle}>Dados de contato e endereço</h2>
    <p className={styles.hint}>Confira seus dados antes de criar o pedido.</p>
    <div className={styles.fields}>
      <label className={styles.field}><span>Nome completo</span><input name="name" autoComplete="name" required maxLength={100} value={details.name} onChange={onChange} /></label>
      <label className={styles.field}><span>Telefone</span><input name="phone" type="tel" autoComplete="tel" required maxLength={25} value={details.phone} onChange={onChange} /></label>
      <label className={styles.field}><span>E-mail</span><input name="email" type="email" autoComplete="email" required maxLength={160} value={details.email} onChange={onChange} /></label>
    </div>
    <div className={styles.addressFields}>
      <label className={styles.field}><span>País</span><select name="country" autoComplete="country" value={details.country} onChange={onChange}><option value="BR">Brasil</option><option value="PT">Portugal</option><option value="US">Estados Unidos</option><option value="other">Outro país</option></select></label>
      <label className={styles.field}><span>{details.country === "BR" ? "CEP" : "Código postal"}</span><input name="postalCode" autoComplete="postal-code" inputMode={details.country === "BR" ? "numeric" : "text"} required maxLength={details.country === "BR" ? 9 : 16} pattern={details.country === "BR" ? "[0-9]{5}-[0-9]{3}" : undefined} placeholder={details.country === "BR" ? "00000-000" : "Código postal"} value={details.postalCode} onChange={onChange} aria-describedby="payment-cep-status" /></label>
      <div id="payment-cep-status" role={cepStatus.error ? "alert" : "status"} className={styles.hint}>{cepStatus.loading ? "Consultando CEP…" : cepStatus.error}</div>
      <label className={styles.field}><span>Logradouro</span><input name="street" autoComplete="address-line1" required maxLength={150} value={details.street} onChange={onChange} /></label>
      <label className={styles.field}><span>Número</span><input name="number" autoComplete="address-line2" required maxLength={20} value={details.number} onChange={onChange} /></label>
      <label className={styles.field}><span>Complemento</span><input name="complement" maxLength={100} value={details.complement} onChange={onChange} /></label>
      <label className={styles.field}><span>Bairro</span><input name="district" maxLength={100} value={details.district} onChange={onChange} /></label>
      <label className={styles.field}><span>Cidade</span><input name="city" autoComplete="address-level2" required maxLength={100} value={details.city} onChange={onChange} /></label>
      <label className={styles.field}><span>Estado / região</span><input name="state" autoComplete="address-level1" required maxLength={50} value={details.state} onChange={onChange} /></label>
    </div>
  </section>;
}
