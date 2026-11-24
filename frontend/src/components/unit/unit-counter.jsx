'use client';

import { useRef, useState } from 'react';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { unitOperation } from '@/hooks/unit/use-unit-data';
import { commerceErrors } from '@/lib/api/commerce-errors.mjs';
import { operationKey } from '@/lib/api/operation-key.mjs';
import SeatMap from '@/components/cinema/assentos/seat-map';
import { accessibleSeat } from '@/components/cinema/assentos/seat-layout.mjs';
import AttendanceCustomerLookup from './attendance-customer-lookup';
import { UnitFeedback } from './unit-layout';
import styles from './unit.module.css';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const ticketNames = { INGRESSO_SESSAO: 'Ingresso', RETIRADA_INSUMO: 'Retirada AstraSnack' };

export default function UnitCounter({ sessionId, onSale }) {
  const path = `/sessions/${sessionId}/counter`;
  const catalog = usePaginatedList(path, unitOperation, { mode: 'resource' });
  const [items, setItems] = useState([]);
  const [productKey,setProductKey]=useState('');
  const [showSeats,setShowSeats]=useState(false);
  const [channel, setChannel] = useState('BALCAO');
  const [customer, setCustomer] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [quote, setQuote] = useState(null);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const attempt = useRef(null);

  function changeCart(next) {
    setItems(next);
    setQuote(null);
    setFeedback('');
  }

  function addItem(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const [kind, selected] = String(fields.get('product')).split(':');
    const product = kind === 'SESSION'
      ? catalog.data.seats.find(item => item.id === selected)
      : catalog.data.snacks.find(item => item.id === selected && item.kind === kind);
    if (!product) return;
    const key = `${kind}:${selected}`;
    if (items.some(item => item.key === key)) return setFeedback('O item já está no pedido.');
    if (items.length >= 50) return setFeedback('O pedido admite até 50 itens diferentes.');
    const line = kind === 'SESSION'
      ? { kind, id: sessionId, seatId: selected, quantity: 1 }
      : { kind, id: selected, quantity: Number(fields.get('quantity')) };
    changeCart([...items, { key, line, label: kind === 'SESSION' ? `Ingresso · ${product.label}` : product.name }]);
    setProductKey('');
    form.reset();
  }

  async function submit(event) {
    event.preventDefault();
    if (lock.current || !items.length || (channel === 'APP' && !customer)) return;
    const cart = { lines: items.map(item => item.line), ageConfirmed, ...(customer && { customerId: customer.id }) };
    lock.current = true;
    setPending(true);
    setFeedback('');
    try {
      if (channel === 'BALCAO' && !quote) {
        const price = await unitOperation(`${path}/quote`, { method: 'POST', body: cart });
        if (!price.finalizable) {
          const problem = price.lines.find(line => line.catalogOutOfSync || line.issue);
          const code = problem?.catalogOutOfSync ? 'CATALOG_PRICE_OUT_OF_SYNC' : problem?.issue;
          throw new Error(commerceErrors[code] ?? 'Confira a disponibilidade e o preço dos itens antes de calcular o total novamente.');
        }
        setQuote(price);
        return;
      }
      const body = { ...cart, channel, ...(channel === 'BALCAO' && {
        expectedTotal: quote.total,
        ...(!customer && { customerName: customerName.trim() }),
      }) };
      const fingerprint = JSON.stringify(body);
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: operationKey() };
      const sale = await unitOperation(`${path}/orders`, { method: 'POST', body, idempotencyKey: attempt.current.key });
      attempt.current = null;
      setResult({ ...sale, customerName: customer?.name });
      changeCart([]);
      setAgeConfirmed(false);
      setCustomer(null);
      setCustomerName('');
      catalog.reload();
      onSale();
    } catch (error) {
      setFeedback(error.message);
      if (error.status === 409) setQuote(null);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  const restricted = catalog.data?.classification !== 'L' && items.some(item => item.line.kind === 'SESSION');
  return <section className={styles.panel} aria-labelledby="counter-title">
    <header className={styles.panelHeader}><h2 id="counter-title">Pedido presencial</h2></header>
    <div className={styles.body}>
      {result && <div className={styles.message} role="status">
        <strong>Pedido #{result.orderId} {result.channel === 'BALCAO' ? 'pago com Pix simulado' : 'enviado para Minhas compras'}.</strong>
        {result.channel === 'BALCAO' && result.customerName && <p>Pedido e ingressos disponíveis em Minhas compras de {result.customerName}.</p>}
        {result.tickets.length > 0 && <ul>{result.tickets.map(ticket => <li key={ticket.code}>
          {ticketNames[ticket.type]} <code className="break-all">{ticket.code}</code>
        </li>)}</ul>}
      </div>}
      {catalog.loading && <p role="status">Consultando catálogo da sessão…</p>}
      <UnitFeedback error={catalog.error || feedback} />
      {catalog.error && <button type="button" className={styles.secondary} onClick={catalog.reload}>Atualizar catálogo</button>}
      {catalog.data && <>
        {!!catalog.data.seatMap?.length&&<div className="mb-4">
          <button type="button" className={styles.secondary} aria-expanded={showSeats} onClick={()=>setShowSeats(value=>!value)}>
            {showSeats?'Recolher mapa da venda':'Escolher ingresso no mapa'}
          </button>
          {showSeats&&<SeatMap seats={catalog.data.seatMap.map(seat=>({...seat,accessible:accessibleSeat(seat.type),occupied:seat.availability!=='DISPONIVEL'}))}
            selection={{continuing:pending,selected:productKey.startsWith('SESSION:')?[productKey.slice(8)]:[],selectSeat:id=>setProductKey(`SESSION:${id}`)}} />}
        </div>}
        <form className={styles.form} onSubmit={addItem}>
          <label>Item<select name="product" required disabled={pending} value={productKey} onChange={event=>setProductKey(event.target.value)}>
            <option value="">Selecione</option>
            <optgroup label="Assentos disponíveis">{catalog.data.seats.map(item => <option key={item.id} value={`SESSION:${item.id}`}>{item.label}</option>)}</optgroup>
            <optgroup label="AstraSnack">{catalog.data.snacks.map(item => <option key={`${item.kind}:${item.id}`} value={`${item.kind}:${item.id}`}>{item.name}</option>)}</optgroup>
          </select></label>
          <label>Quantidade de produtos<input name="quantity" type="number" min="1" max="100" defaultValue="1" required disabled={pending} /></label>
          <button className={styles.secondary} disabled={pending}>Adicionar item</button>
        </form>
        {items.length > 0 && <>
          <ul className={styles.list}>{items.map(item => <li key={item.key}>
            <strong>{item.line.quantity} × {item.label}</strong>
            <button type="button" className={styles.secondary} disabled={pending} onClick={() => changeCart(items.filter(row => row.key !== item.key))} aria-label={`Remover ${item.label}`}>Remover</button>
          </li>)}</ul>
          <AttendanceCustomerLookup path={`${path}/customers`} selected={customer} disabled={pending}
            onSelect={value => { setCustomer(value); setQuote(null); setFeedback(''); }} />
          <form className={styles.form} onSubmit={submit} aria-busy={pending}>
            <label>Pagamento<select value={channel} disabled={pending} onChange={event => { setChannel(event.target.value); setQuote(null); }}>
              <option value="BALCAO">Pix simulado no balcão</option><option value="APP">Site com cadastro</option>
            </select></label>
            {!customer && channel === 'APP' && <p className={styles.full}>Selecione um cliente para enviar o pedido.</p>}
            {!customer && channel === 'BALCAO' && <label>Nome do comprador
              <input name="customerName" required minLength={2} maxLength={100} autoComplete="off" value={customerName}
                disabled={pending} onChange={event => setCustomerName(event.target.value)} />
            </label>}
            {channel === 'BALCAO' && restricted && <div className={styles.full}>
              <label className="flex! items-center gap-2"><input className="w-auto!" type="checkbox" required checked={ageConfirmed} disabled={pending} onChange={event => { setAgeConfirmed(event.target.checked); setQuote(null); }} />
                Confirmei a idade mínima de {catalog.data.classification} anos. Em caso de dúvida, conferi a identidade.</label>
            </div>}
            {quote && <strong aria-live="polite">Total {currency.format(quote.total)}</strong>}
            <button className={styles.button} disabled={pending || (channel === 'APP' && !customer)}>{pending ? 'Processando…' : channel === 'APP' ? 'Enviar ao cliente' : quote ? 'Confirmar Pix simulado' : 'Calcular total'}</button>
          </form>
        </>}
      </>}
    </div>
  </section>;
}
