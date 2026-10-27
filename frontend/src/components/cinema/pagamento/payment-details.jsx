import styles from "./payment.module.css";

export default function PaymentDetails({ details, onChange }) {
  const fields = [
    { name: "name", label: "Nome completo", autoComplete: "name", placeholder: "Como está no seu cadastro", maxLength: 100 },
    { name: "phone", label: "Telefone", type: "tel", autoComplete: "tel", placeholder: "(11) 99999-9999", maxLength: 25 },
    { name: "email", label: "E-mail", type: "email", autoComplete: "email", placeholder: "voce@exemplo.com", maxLength: 160 },
    { name: "address", label: "Endereço", autoComplete: "street-address", placeholder: "Rua, número e complemento", maxLength: 180 },
  ];
  return <section aria-labelledby="payment-details-title">
    <h2 id="payment-details-title" className={styles.sectionTitle}>Detalhes do pagamento</h2>
    <p className={styles.hint}>Preencha seus dados para revisar o pedido.</p>
    <div className={styles.fields}>
      {fields.map(({ name, label, ...props }) => <label key={name} className={styles.field}><span>{label}</span><input {...props} name={name} required value={details[name]} onChange={onChange} /></label>)}
    </div>
    <div className={styles.addressFields}>
      <label className={styles.field}><span>País</span><select name="country" autoComplete="country" value={details.country} onChange={onChange}><option value="BR">Brasil</option><option value="PT">Portugal</option><option value="US">Estados Unidos</option><option value="other">Outro país</option></select></label>
      <label className={styles.field}><span>Cidade</span><input name="city" autoComplete="address-level2" required maxLength={100} placeholder="Sua cidade" value={details.city} onChange={onChange} /></label>
      <label className={styles.field}><span>Código postal</span><input name="postalCode" autoComplete="postal-code" required maxLength={16} placeholder={details.country === "BR" ? "00000-000" : "Código postal"} value={details.postalCode} onChange={onChange} /></label>
    </div>
  </section>;
}
