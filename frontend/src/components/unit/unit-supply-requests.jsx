'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitListState, UnitMore, dateTime, label } from './unit-layout';
import styles from './unit.module.css';

const stockLabels = { SALDO_INSUFICIENTE: 'Saldo insuficiente na origem', INDISPONIVEL: 'Item indisponível na origem' };

export default function UnitSupplyRequests({ list }) {
  const [selected, setSelected] = useState(null);
  const alternatives = useUnitList(selected ? `/requests/${selected.id_solicitacao}/alternatives` : null, unitOperation);

  return <section className={styles.panel} aria-labelledby="unit-stock-requests">
    <header className={styles.panelHeader}><div>
      <h2 id="unit-stock-requests">Solicitações</h2>
      <p>Acompanhe os pedidos de reposição e consulte alternativas em caso de falta.</p>
    </div></header>
    <div className={styles.body}>
      <UnitListState list={list} empty="Nenhuma solicitação cadastrada." />
      {list.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th scope="col">Pedido</th><th scope="col">Item</th><th scope="col">Qtd.</th>
          <th scope="col">Data</th><th scope="col">Estado</th><th scope="col">Ações</th></tr></thead>
        <tbody>{list.items.map(row => <tr key={row.id_solicitacao}>
          <th scope="row">#{row.id_solicitacao}</th>
          <td>{row.nome_item ?? (row.id_equipamento ? `Equipamento #${row.id_equipamento}` : `Insumo #${row.id_insumo}`)}</td>
          <td>{row.quantidade}</td><td>{dateTime(row.data_solicitacao)}</td>
          <td><span className={styles.badge}>{label(row.status)}</span>
            {stockLabels[row.estoque_origem] && <p>{stockLabels[row.estoque_origem]}</p>}
          </td>
          <td>{(row.status === 'RECUSADA' || stockLabels[row.estoque_origem]) &&
            <button type="button" className={styles.iconButton} title="Consultar alternativas"
              aria-label={`Consultar alternativas para a solicitação ${row.id_solicitacao}`}
              onClick={() => setSelected(row)}><Search size={16} aria-hidden="true" /></button>}
          </td>
        </tr>)}</tbody>
      </table></div>}
      <UnitMore list={list} />
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>Alternativas para a solicitação #{selected?.id_solicitacao}</DialogTitle>
        <DialogDescription>Confira a compatibilidade do item antes de fazer um novo pedido. A lista considera materiais com o mesmo nome e categoria que atendem à quantidade solicitada.</DialogDescription>
        <UnitListState list={alternatives} empty="Nenhum fornecedor alternativo disponível para esta solicitação." />
        {alternatives.items.length > 0 && <ul className={styles.list}>
          {alternatives.items.map(item => <li key={item.item_id}>
            <div><strong>{item.nome}</strong><small>{item.fornecedor} · {item.nome_origem}</small></div>
          </li>)}
        </ul>}
      </DialogContent>
    </Dialog>
  </section>;
}
