'use client';

import { useState } from 'react';
import { Check, Eye, RotateCcw, Send, Truck, X, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useSupplierAction, useSupplierList, useSupplierLocations } from '@/hooks/supplier/use-supplier-data';
import SupplierLayout, { dateTime, More, SupplierState, statusName } from './supplier-layout';
import styles from '@/components/admin/catalog/catalog.module.css';

const labels = { approve: 'Aprovar', refuse: 'Recusar', send: 'Enviar', transit: 'Marcar em trânsito', return: 'Confirmar devolução', cancel: 'Cancelar envio' };
const icons = { approve: Check, refuse: X, send: Send, transit: Truck, return: RotateCcw, cancel: XCircle };
const kilometers = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const stockLabels = { SALDO_INSUFICIENTE: 'Saldo insuficiente', INDISPONIVEL: 'Item indisponível' };

export default function SupplierFlow({ kind }) {
  const requests = kind === 'requests';
  const [localId, setLocalId] = useState('');
  const [dialog, setDialog] = useState(null);
  const list = useSupplierList(`${kind}?limit=20${localId ? `&localId=${localId}` : ''}`);
  const locations = useSupplierLocations();
  const action = useSupplierAction(list.reload);
  const item = dialog?.item;
  const idKey = requests ? 'id_solicitacao' : 'id_logistica';
  const itemName = row => row.nome_item ?? (row.id_insumo || row.id_insumo_origem
    ? `Insumo #${row.id_insumo ?? row.id_insumo_origem}`
    : row.id_equipamento || row.id_equipamento_origem ? `Equipamento #${row.id_equipamento ?? row.id_equipamento_origem}` : '—');
  function possible(row) {
    if (requests) {
      if (row.status !== 'PENDENTE') return [];
      return stockLabels[row.estoque_origem] ? ['refuse'] : ['approve', 'refuse'];
    }
    if (row.status === 'PENDENTE') return ['send', 'cancel'];
    if (row.status === 'ENVIADO') return ['transit'];
    if (row.status === 'RECEBIDO' && row.id_equipamento_origem && row.id_solicitacao) return ['return'];
    return [];
  }
  function open(type, row) { action.setError(''); setDialog({ type, item: row }); }
  async function confirm() {
    const notice = dialog.type === 'return' ? 'Devolução confirmada.' : `${labels[dialog.type]} registrado.`;
    if (await action.run(`${kind}/${item[idKey]}/${dialog.type}`, { method: 'POST' }, notice)) setDialog(null);
  }
  return <SupplierLayout title={requests ? 'Solicitações' : 'Entregas'} description={requests ? 'Analise os pedidos de reposição dos cinemas.' : 'Acompanhe e atualize os envios aprovados.'}>
    {action.notice && <p className={styles.notice} role="status">{action.notice}</p>}
    <section className={styles.panel}><header className={styles.panelHeader}><div><h2>{requests ? 'Pedidos recebidos' : 'Envios'}</h2><p>{requests ? 'A aprovação gera um envio para a logística.' : 'O cinema confirma o recebimento após o envio.'}</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Cinema {requests ? 'solicitante' : 'de destino'}<select value={localId} onChange={event => setLocalId(event.target.value)}><option value="">Todos</option>{locations.items.map(row => <option key={row.id_local} value={row.id_local}>{locations.name(row.id_local)}</option>)}</select></label><button type="button" className={styles.secondary} onClick={list.reload} disabled={list.loading}>Atualizar</button></div>
      <SupplierState list={list} noun={requests ? 'solicitações' : 'entregas'} empty={requests ? 'Nenhuma solicitação encontrada.' : 'Nenhuma entrega encontrada.'} />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={`${requests ? 'Solicitações' : 'Entregas'}; role horizontalmente em telas pequenas`} tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">{requests ? 'Solicitação' : 'Envio'}</th><th scope="col">Item</th>{!requests && <th scope="col">Origem</th>}<th scope="col">Destino</th><th scope="col">Quantidade</th><th scope="col">Status</th><th scope="col">Data</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row[idKey]}><th scope="row">#{row[idKey]}</th><td>{itemName(row)}</td>{!requests && <td>{locations.name(row.id_local_origem)}</td>}<td>{locations.name(requests ? row.id_local : row.id_local_destino)}</td><td>{row.quantidade}</td><td><span className={`${styles.badge} ${['RECUSADA', 'CANCELADO'].includes(row.status) ? styles.inactive : ''}`}>{statusName(row.status)}</span>{requests && stockLabels[row.estoque_origem] && <p>{stockLabels[row.estoque_origem]}</p>}</td><td>{dateTime(requests ? row.data_solicitacao : row.data_envio)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver ${row[idKey]}`} onClick={() => open('view', row)}><Eye size={16} aria-hidden="true" /></button>{possible(row).map(type => { const Icon = icons[type]; return <button key={type} type="button" className={`${styles.iconButton} ${['refuse', 'cancel'].includes(type) ? styles.destructive : ''}`} title={labels[type]} aria-label={`${labels[type]} ${row[idKey]}`} onClick={() => open(type, row)}><Icon size={16} aria-hidden="true" /></button>; })}</div></td></tr>)}</tbody></table></div>}
      <More list={list} noun={requests ? 'solicitações' : 'entregas'} />
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value && !action.pending) setDialog(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === 'view' ? 'Detalhes' : labels[dialog?.type]} #{item?.[idKey]}</DialogTitle><DialogDescription className={styles.dialogDescription}>
      {dialog?.type === 'return'
        ? 'Confirme somente após o fim da sessão e o retorno do equipamento ao estoque de origem.'
        : dialog?.type === 'view' ? 'Informações do registro selecionado.' : `Confirme: ${labels[dialog?.type]?.toLocaleLowerCase('pt-BR')}.`}
    </DialogDescription>
      {item && <dl className={styles.detailGrid}>
        <div><dt>Item</dt><dd>{itemName(item)}</dd></div>
        <div><dt>Quantidade</dt><dd>{item.quantidade}</dd></div>
        {!requests && <div><dt>Origem</dt><dd>{locations.name(item.id_local_origem)}</dd></div>}
        <div><dt>Destino</dt><dd>{locations.name(requests ? item.id_local : item.id_local_destino)}</dd></div>
        <div><dt>Status</dt><dd>{statusName(item.status)}</dd></div>
        {requests && item.status === 'PENDENTE' && <div>
          <dt>Estoque na origem</dt><dd>{stockLabels[item.estoque_origem] ?? (item.estoque_origem === 'DISPONIVEL' ? 'Disponível' : 'Sem informação')}</dd>
        </div>}
        {requests && item.status === 'PENDENTE' && <div><dt>Tempo estimado de viagem</dt><dd>
          {item.tempo_estimado_min == null
            ? 'Sem previsão'
            : `${item.tempo_estimado_min} min · ${kilometers.format(Number(item.distancia_km))} km`}
        </dd></div>}
        <div><dt>{requests ? 'Solicitado em' : 'Enviado em'}</dt><dd>{dateTime(requests ? item.data_solicitacao : item.data_envio)}</dd></div>
        {!requests && <>
          <div><dt>Solicitação</dt><dd>{item.id_solicitacao ? `#${item.id_solicitacao}` : '—'}</dd></div>
          <div><dt>Previsão de entrega</dt><dd>{item.data_prevista ? dateTime(item.data_prevista) : 'Sem previsão'}</dd></div>
          <div><dt>Recebido em</dt><dd>{dateTime(item.data_recebimento)}</dd></div>
          {item.data_devolucao && <div><dt>Devolvido em</dt><dd>{dateTime(item.data_devolucao)}</dd></div>}
        </>}
        {item.observacao && <div><dt>Observação</dt><dd>{item.observacao}</dd></div>}
      </dl>}
      {action.error && <p className={styles.error} role="alert">{action.error}</p>}
      <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>{dialog?.type === 'view' ? 'Fechar' : 'Voltar'}</button>{dialog?.type !== 'view' && <button type="button" className={['refuse', 'cancel'].includes(dialog?.type) ? styles.danger : styles.primary} disabled={action.pending} onClick={confirm}>{action.pending ? 'Aguarde…' : 'Confirmar'}</button>}</div>
    </DialogContent></Dialog>
  </SupplierLayout>;
}
