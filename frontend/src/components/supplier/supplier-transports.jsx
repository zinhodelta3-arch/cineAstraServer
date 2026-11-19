'use client';

import { Archive,Eye,Pencil,Plus,RotateCcw } from 'lucide-react';
import { Dialog,DialogContent,DialogDescription,DialogTitle } from '@/components/ui/dialog';
import { useSupplierTransports } from '@/hooks/supplier/use-supplier-transports';
import SupplierLayout,{ dateTime,More,SupplierState,statusName } from './supplier-layout';
import styles from '@/components/admin/catalog/catalog.module.css';

export default function SupplierTransports() {
  const transport=useSupplierTransports();
  const {list,action,dialog,item}=transport;
  const types=list.data?.types ?? [];
  return <SupplierLayout title="Transportes" description="Cadastre e acompanhe os meios de transporte próprios da sua empresa." action={<button type="button" className={styles.primary} onClick={()=>transport.open('form')}><Plus size={16} aria-hidden="true"/>Novo transporte</button>}>
    {action.notice&&<p className={styles.notice} role="status">{action.notice}</p>}
    <section className={styles.panel} aria-labelledby="supplier-transports-title">
      <header className={styles.panelHeader}><div><h2 id="supplier-transports-title">Transportes próprios</h2><p>Registros vinculados ao seu fornecedor.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}>
        <label className={styles.filter}>Buscar<input type="search" value={transport.query} maxLength={120} placeholder="Nome, tipo ou identificação" onChange={event=>transport.setQuery(event.target.value)}/></label>
        <label className={styles.filter}>Cadastro<select value={transport.status} onChange={event=>transport.setStatus(event.target.value)}><option value="">Todos</option><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></label>
        <button type="button" className={styles.secondary} onClick={list.reload} disabled={list.loading}>Atualizar</button>
      </div>
      <SupplierState list={list} noun="transportes" empty="Nenhum transporte encontrado."/>
      {list.items.length>0&&<div className={styles.tableWrap} role="region" aria-label="Tabela de transportes; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}>
        <caption className="sr-only">Transportes próprios do fornecedor</caption>
        <thead><tr><th scope="col">Transporte</th><th scope="col">Tipo</th><th scope="col">Identificação</th><th scope="col">Cadastro</th><th scope="col">Ocupação</th><th scope="col">Ações</th></tr></thead>
        <tbody>{list.items.map(row=><tr key={row.id_transporte}>
          <th scope="row">{row.nome}</th><td>{row.tipo}</td><td>{row.identificacao||'—'}</td><td><span className={`${styles.badge} ${row.status==='INATIVO'?styles.inactive:''}`}>{statusName(row.status)}</span></td>
          <td>{row.em_uso ? `Em uso · Entrega #${row.id_entrega_ativa}` : 'Sem entrega ativa'}</td>
          <td><div className={styles.actions}>
            <button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver transporte ${row.nome}`} onClick={()=>transport.open('view',row)}><Eye size={16} aria-hidden="true"/></button>
            <button type="button" className={styles.iconButton} title="Editar transporte" aria-label={`Editar transporte ${row.nome}`} onClick={()=>transport.open('form',row)}><Pencil size={16} aria-hidden="true"/></button>
            <button type="button" className={styles.iconButton} title={row.status==='ATIVO'?'Inativar transporte':'Reativar transporte'} aria-label={`${row.status==='ATIVO'?'Inativar':'Reativar'} transporte ${row.nome}`} onClick={()=>transport.open('status',row)}>{row.status==='ATIVO'?<Archive size={16} aria-hidden="true"/>:<RotateCcw size={16} aria-hidden="true"/>}</button>
          </div></td>
        </tr>)}</tbody>
      </table></div>}
      <More list={list} noun="transportes"/>
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value=>{if(!value)transport.close();}}><DialogContent className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>{dialog?.type==='view'?'Detalhes do transporte':dialog?.type==='status'?item?.status==='ATIVO'?'Inativar transporte':'Reativar transporte':item?'Editar transporte':'Novo transporte'}</DialogTitle>
      <DialogDescription className={styles.dialogDescription}>{dialog?.type==='status'?`Confirme a alteração de estado de ${item?.nome}. O cadastro será preservado.`:'Informe os dados de identificação do transporte próprio.'}</DialogDescription>
      {dialog?.type==='view'&&item&&<dl className={styles.detailGrid}>
        <div><dt>Nome</dt><dd>{item.nome}</dd></div><div><dt>Tipo</dt><dd>{item.tipo}</dd></div><div><dt>Identificação / placa</dt><dd>{item.identificacao||'—'}</dd></div><div><dt>Cadastro</dt><dd>{statusName(item.status)}</dd></div><div><dt>Ocupação</dt><dd>{item.em_uso ? `Entrega #${item.id_entrega_ativa} · ${statusName(item.status_entrega_ativa)}` : 'Sem entrega ativa'}</dd></div><div><dt>Cadastrado em</dt><dd>{dateTime(item.criado_em)}</dd></div><div><dt>Atualizado em</dt><dd>{dateTime(item.atualizado_em)}</dd></div>{item.observacao&&<div><dt>Observações</dt><dd>{item.observacao}</dd></div>}
      </dl>}
      {dialog?.type==='form'&&<form key={item?.id_transporte??'new'} className={styles.form} onSubmit={transport.save}>
        <label className={styles.wide}>Nome<input name="nome" required maxLength={120} defaultValue={item?.nome??''}/></label>
        <label>Tipo<select name="tipo" required defaultValue={item?.tipo??''} disabled={!types.length}>
          <option value="">{list.loading ? 'Carregando tipos…' : 'Selecione um tipo'}</option>
          {item?.tipo && !types.includes(item.tipo) && <option value={item.tipo}>{item.tipo}</option>}
          {types.map(type => <option key={type} value={type}>{type}</option>)}
        </select></label>
        {list.error && !types.length && <div className={styles.wide}><p role="alert" className={styles.error}>{list.error}</p><button type="button" className={styles.secondary} onClick={list.reload}>Recarregar tipos</button></div>}
        <label>Identificação / placa<input name="identificacao" maxLength={40} defaultValue={item?.identificacao??''}/></label>
        {item&&<label>Cadastro<select name="status" defaultValue={item.status}><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></label>}
        {item?.em_uso&&<p className={`${styles.hint} ${styles.wide}`}>A entrega #{item.id_entrega_ativa} ocupa o transporte até o recebimento. Alterar o cadastro não encerra a entrega.</p>}
        <label className={styles.wide}>Observações<textarea name="observacao" maxLength={2000} defaultValue={item?.observacao??''}/></label>
        {action.error&&<p className={`${styles.error} ${styles.wide}`} role="alert">{action.error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} disabled={action.pending} onClick={transport.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={action.pending || !types.length}>{action.pending?'Salvando…':'Salvar transporte'}</button></div>
      </form>}
      {dialog?.type!=='form'&&<>{action.error&&<p className={styles.error} role="alert">{action.error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} disabled={action.pending} onClick={transport.close}>{dialog?.type==='view'?'Fechar':'Cancelar'}</button>{dialog?.type==='status'&&<button type="button" className={styles.primary} disabled={action.pending} onClick={transport.changeStatus}>{action.pending?'Salvando…':'Confirmar'}</button>}</div></>}
    </DialogContent></Dialog>
  </SupplierLayout>;
}
