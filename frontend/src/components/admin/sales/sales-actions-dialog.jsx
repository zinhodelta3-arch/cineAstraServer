'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserLookupFilter from '@/components/admin/people/user-lookup-filter';
import { salesRequest } from '@/hooks/admin/use-admin-sales';
import { operationKey } from '@/lib/api/operation-key.mjs';
import { dateTime, money, statusName } from './sales-layout';
import styles from '../catalog/catalog.module.css';

const kinds = { INPUT: 'Produto avulso', COMBO: 'Combo', SESSION: 'Ingresso', STREAMING: 'Aluguel de filme' };
const emptyLine = { kind: 'INPUT', id: '', quantity: 1, key: 0 };
const titles = { create: 'Nova proposta de pedido', edit: 'Editar proposta', cancel: 'Cancelar pedido', refund: 'Solicitar reembolso', reconcile: 'Consultar provedor', notes: 'Notas administrativas', archive:'Arquivar registro', pix:'Registrar Pix simulado' };

export default function SalesActionsDialog({ mode, row, onClose, onSaved, resource }) {
  const [userId, setUserId] = useState('');
  const [lines, setLines] = useState(() => row?.draft?.lines.map((line, key) => ({ ...line, key })) ?? [emptyLine]);
  const [notes, setNotes] = useState(null);
  const [notesError, setNotesError] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const nextKey = useRef(lines.length);
  const lock = useRef(false);
  const requestAttempt=useRef(null);
  const id = row?.id;
  const draftMode = mode === 'create' || mode === 'edit';

  useEffect(() => {
    if (mode !== 'notes') return;
    const controller = new AbortController();
    salesRequest(`payments/${id}/notes`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setNotes(data.items); })
      .catch(cause => { if (!controller.signal.aborted) setNotesError(cause.message); });
    return () => controller.abort();
  }, [id, mode]);

  function changeLine(key, changes) {
    setLines(previous => previous.map(line => line.key === key ? { ...line, ...changes } : line));
  }

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    if (mode === 'create' && !userId) return setError('Selecione um cliente.');
    const form = new FormData(event.currentTarget);
    let path = mode === 'cancel' ? `orders/${id}/cancel` : `payments/${id}/${mode}`;
    let body = mode === 'notes' ? { note: String(form.get('note') ?? '').trim() } : {};
    if(mode==='cancel')body={reason:String(form.get('reason')).trim()};
    if(mode==='archive')path=`${resource}/${id}/archive`;
    if(mode==='pix')path=`orders/${id}/simulated-pix`;
    if(mode==='refund'){
      path=`orders/${id}/refunds`;
      body={reason:String(form.get('refundReason')),details:String(form.get('details')).trim(),...(row.paymentId&&{paymentId:row.paymentId})};
    }
    if (draftMode) {
      const localId = String(form.get('localId') ?? '').trim();
      const draft = {
        ...(localId ? { localId } : {}),
        lines: lines.map(line => ({
          kind: line.kind, id: line.id, quantity: ['SESSION','STREAMING'].includes(line.kind) ? 1 : Number(line.quantity),
          ...(line.kind === 'SESSION' ? { seatId: line.seatId } : line.kind === 'COMBO' ? { sessionId: line.sessionId } : line.kind === 'STREAMING' ? { mode: 'ALUGUEL' } : {})
        }))
      };
      path = mode === 'create' ? 'orders' : `orders/${id}`;
      body = mode === 'create' ? { userId, draft } : draft;
    }
    lock.current = true;
    setPending(true);
    setError('');
    try {
      if(mode==='refund'||mode==='pix'){
        const fingerprint=JSON.stringify(body);
        if(requestAttempt.current?.fingerprint!==fingerprint)requestAttempt.current={fingerprint,key:operationKey()};
      }
      const result = await salesRequest(path, { method: mode === 'edit' ? 'PATCH' : 'POST', body, idempotencyKey:requestAttempt.current?.key });
      const messages = { create: 'Proposta disponível em Minhas compras para o cliente.', edit: 'Proposta atualizada.', cancel: 'Pedido cancelado.', refund:'Solicitação disponível para análise em Reembolsos.', reconcile: `Consulta concluída. Estado atual do pagamento: ${statusName(result.status)}.`, notes: 'Nota adicionada ao histórico.', archive:'Registro movido para Arquivados.', pix:`Pix simulado confirmado. Pagamento #${result.paymentId}.` };
      onSaved(messages[mode]);
    } catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }

  return <Dialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}>
    <DialogContent className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>{titles[mode]}{id && ` #${id}`}</DialogTitle>
      <DialogDescription className={styles.dialogDescription}>{draftMode ? 'O cliente selecionado revisará os itens e o preço antes de concluir a compra.' : mode === 'notes' ? 'As notas ficam no histórico administrativo do pagamento.' : mode === 'refund' ? 'A solicitação passa pela análise em Reembolsos. O pedido original fica no histórico.' : mode === 'cancel' ? 'As reservas de um pedido pendente serão liberadas quando o cancelamento for aceito.' : mode === 'archive' ? 'O registro continuará disponível em Arquivados, com seu histórico financeiro e vínculos.' : mode === 'pix' ? `O simulador vai confirmar o valor reservado de ${money(row.total)}. A confirmação emite os ingressos e conclui as reservas do pedido.` : 'A consulta usa o provedor vinculado ao pagamento.'}</DialogDescription>
      <form className={styles.form} onSubmit={submit}>
        {mode === 'create' && <div className={styles.wide}><UserLookupFilter activeOnly label="Cliente" role="CLIENTE" value={userId} onChange={setUserId} /></div>}
        {mode==='cancel'&&<label className={styles.wide}>Motivo do cancelamento<textarea name="reason" required minLength={3} maxLength={1000} /></label>}
        {mode==='refund'&&<>
          <label>Motivo<select name="refundReason" required defaultValue=""><option value="">Selecione</option><option value="ARREPENDIMENTO">Arrependimento</option><option value="DEFEITO">Problema com a compra</option><option value="OUTRO">Outro motivo</option></select></label>
          <label className={styles.wide}>Justificativa<textarea name="details" required maxLength={1000} /></label>
        </>}
        {draftMode && <>
          <label className={styles.wide}>ID do cinema<input name="localId" inputMode="numeric" pattern="[1-9][0-9]{0,19}" defaultValue={row?.draft?.localId ?? ''} placeholder="Obrigatório para AstraSnack" /></label>
          {lines.map((line,index) => <fieldset className={`${styles.form} ${styles.wide}`} key={line.key}>
            <legend>Item {index + 1}</legend>
            <label>Tipo<select value={line.kind} onChange={event => changeLine(line.key,{ ...emptyLine, key:line.key, kind:event.target.value, seatId:'', sessionId:'' })}>{Object.entries(kinds).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label>{line.kind === 'SESSION' ? 'ID da sessão' : 'ID do item'}<input value={line.id} required inputMode="numeric" pattern="[1-9][0-9]{0,19}" onChange={event => changeLine(line.key,{id:event.target.value})} /></label>
            {line.kind === 'SESSION' && <label>ID do assento<input value={line.seatId ?? ''} required inputMode="numeric" pattern="[1-9][0-9]{0,19}" onChange={event => changeLine(line.key,{seatId:event.target.value})} /></label>}
            {line.kind === 'COMBO' && <label>ID da sessão de retirada<input value={line.sessionId ?? ''} required inputMode="numeric" pattern="[1-9][0-9]{0,19}" onChange={event => changeLine(line.key,{sessionId:event.target.value})} /></label>}
            {['INPUT','COMBO'].includes(line.kind) && <label>Quantidade<input type="number" required min="1" max="100" value={line.quantity} onChange={event => changeLine(line.key,{quantity:event.target.value})} /></label>}
            <button type="button" className={styles.secondary} disabled={lines.length === 1 || pending} onClick={() => setLines(previous => previous.filter(item => item.key !== line.key))}>Remover item</button>
          </fieldset>)}
          <button type="button" className={styles.secondary} disabled={lines.length >= 50 || pending} onClick={() => { const key = nextKey.current++; setLines(previous => [...previous,{...emptyLine,key}]); }}>Adicionar item</button>
        </>}
        {mode === 'notes' && <div className={styles.wide}>
          {notesError ? <p role="alert">{notesError}</p> : notes == null ? <p role="status">Carregando histórico…</p> : notes.length > 0 && <ul>
            {notes.map(note => <li key={note.id}><small>{dateTime(note.createdAt)} · Admin #{note.adminId}</small><p>{note.note}</p></li>)}
          </ul>}
          <label>Nova nota<textarea name="note" required maxLength={1000} /></label>
        </div>}
        {error && <p role="alert" className={`${styles.error} ${styles.wide}`}>{error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} disabled={pending} onClick={onClose}>Voltar</button><button type="submit" className={mode === 'cancel' ? styles.danger : styles.primary} disabled={pending}>{pending ? 'Processando…' : mode==='archive' ? 'Arquivar' : mode==='pix' ? 'Confirmar Pix simulado' : 'Confirmar'}</button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
