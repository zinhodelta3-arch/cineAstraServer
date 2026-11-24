'use client';

import { useState } from 'react';
import { unitOperation, useUnitAction } from '@/hooks/unit/use-unit-data';
import { UnitFeedback } from './unit-layout';
import styles from './unit.module.css';

const types = [['ENTRADA','Entrada'],['SAIDA','Saída'],['PERDA','Perda']];

export default function UnitStockMovement({ inputs, equipment, reloadStock }) {
  const [kind, setKind] = useState('input');
  const [type, setType] = useState('ENTRADA');
  const [itemId, setItemId] = useState('');
  const action = useUnitAction(reloadStock, unitOperation);
  const isEquipment = kind === 'equipment';
  const key = isEquipment ? 'id_equipamento' : 'id_insumo';
  const rows = (isEquipment ? equipment : inputs).filter(row =>
    row.movimentavel && (type === 'ENTRADA' || (row.disponivel ?? row.quantidade) > 0)
  );
  const item = rows.find(row => row[key] === itemId);
  const max = type === 'ENTRADA' ? 2147483647 - (item?.quantidade ?? 0) : item?.disponivel ?? item?.quantidade ?? 0;

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const count = Number(fields.get('quantity'));
    const reason = String(fields.get('reason') ?? '').trim();
    if (!item || !Number.isInteger(count) || count < 1 || count > max || !reason) {
      return action.setError('Selecione um item e informe uma quantidade válida e a justificativa.');
    }
    const body = { [isEquipment ? 'equipmentId' : 'inputId']:itemId, tipo:type,
      quantidade:type === 'ENTRADA' ? count : -count, motivo:reason };
    const title = types.find(([value]) => value === type)[1];
    if (await action.run('/inventory/movements', { method:'POST', body }, `${title} registrada. O saldo foi atualizado.`)) {
      form.reset();
      setItemId('');
    }
  }

  return <section className={`${styles.panel} ${styles.ticket}`} aria-labelledby="stock-movement-title">
    <header className={styles.panelHeader}><div>
      <h2 id="stock-movement-title">Registrar movimentação avulsa</h2>
      <p>Para entregas de fornecedores, confirme o recebimento na seção Entregas.</p>
    </div></header>
    <div className={styles.body}>
      <form className={styles.form} onSubmit={submit}>
        <label>Categoria<select value={kind} onChange={event => { setKind(event.target.value); setItemId(''); }} disabled={action.pending}>
          <option value="input">Insumo</option><option value="equipment">Equipamento</option>
        </select></label>
        <label>Tipo<select value={type} onChange={event => { setType(event.target.value); setItemId(''); }} disabled={action.pending}>
          {types.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
        </select></label>
        <label className={styles.full}>Item<select value={itemId} onChange={event => setItemId(event.target.value)} required disabled={action.pending || !rows.length}>
          <option value="">{rows.length ? 'Selecione' : 'Nenhum item disponível para esta movimentação'}</option>
          {rows.map(row => <option key={row[key]} value={row[key]}>{row.nome} · {row.disponivel ?? row.quantidade} disponíveis</option>)}
        </select></label>
        <label>Quantidade<input type="number" name="quantity" min="1" max={max} required disabled={action.pending || !item} /></label>
        <label>Justificativa<input name="reason" required maxLength={255} disabled={action.pending} /></label>
        <button type="submit" className={styles.button} disabled={action.pending || !item || max < 1}>{action.pending ? 'Registrando…' : 'Registrar'}</button>
      </form>
      <UnitFeedback error={action.error} notice={action.notice} />
    </div>
  </section>;
}
