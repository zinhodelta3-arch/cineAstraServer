import { ArrowLeftRight, Gauge } from 'lucide-react';
import EquipmentPosition from '@/components/inventory/equipment-position';
import { More, SupplierState, statusName } from './supplier-layout';
import styles from '@/components/admin/catalog/catalog.module.css';

export default function SupplierStockTable({ title, description, kind, list, open, id }) {
  const input = kind === 'inputs';
  const key = input ? 'id_insumo' : 'id_equipamento';
  const noun = input ? 'insumos' : 'equipamentos';
  return <section className={`${styles.panel} ${styles.spacedPanel}`} aria-labelledby={id}>
    <header className={styles.panelHeader}><div><h2 id={id}>{title}</h2><p>{description}</p></div></header>
    <SupplierState list={list} noun={noun} empty="Nenhum item nesta tabela." />
    {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={title} tabIndex={0}>
      <table className={styles.table}>
        <thead><tr><th scope="col">Item</th><th scope="col">Proprietário</th><th scope="col">Unidade vinculada</th>
          {!input && <th scope="col">Posição</th>}<th scope="col">{input ? 'Em mãos' : 'Quantidade'}</th>
          {input && <th scope="col">Mínimo</th>}<th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
        <tbody>{list.items.map(row => <tr key={row[key]}>
          <th scope="row">{row.nome}</th>
          <td>{row.nome_fornecedor ?? "Fornecedor"}</td>
          <td>{row.nome_local ?? (row.id_local ? "Unidade vinculada" : 'Sem unidade vinculada')}</td>
          {!input && <td><EquipmentPosition item={row} /></td>}
          <td>{row.quantidade}</td>{input && <td>{row.quantidade_minima}</td>}
          <td><span className={`${styles.badge} ${row.status !== 'DISPONIVEL' ? styles.inactive : ''}`}>{statusName(row.status)}</span></td>
          <td><div className={styles.actions}>
            <button type="button" className={styles.iconButton} title="Ver saldo" aria-label={`Ver saldo de ${row.nome}`} onClick={() => open(kind, row, 'balance')}><Gauge size={16} aria-hidden="true" /></button>
            <button type="button" className={styles.iconButton} title="Movimentar" aria-label={`Movimentar ${row.nome}`} onClick={() => open(kind, row, 'move')}><ArrowLeftRight size={16} aria-hidden="true" /></button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>}
    <More list={list} noun="itens" />
  </section>;
}
