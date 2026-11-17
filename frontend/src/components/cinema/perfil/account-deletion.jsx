'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import useProfileResource, { profileRequest } from '@/hooks/cinema/perfil/use-profile-resource';
import Modal from './modal';

const labels = { RECEBIDA: 'Recebida', EM_ANALISE: 'Em análise', RECUSADA: 'Recusada' };

export default function AccountDeletion() {
  const resource = useProfileResource('privacy');
  const request = resource.data?.request;
  const ongoing = request && ['RECEBIDA','EM_ANALISE'].includes(request.status);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (working || confirmation !== 'EXCLUIR') return;
    const data = new FormData(event.currentTarget);
    setWorking(true);
    setError('');
    try {
      await profileRequest('privacy', 'DELETE', { password: data.get('password'), ...(data.get('code') && { code: data.get('code') }) });
      setOpen(false);
      resource.retry();
    } catch (cause) { setError(cause.message); }
    finally { setWorking(false); }
  }
  return <div className="space-y-3 border-t border-border pt-4">
    <h3 className="font-bold">Exclusão da conta</h3>
    {resource.loading && <p role="status" className="text-sm">Consultando solicitações…</p>}
    {resource.error && <div role="alert" className="text-sm"><p>{resource.error}</p><Button variant="outline" onClick={resource.retry}>Tentar novamente</Button></div>}
    {request && <div className="text-sm" role="status">
      <p>Protocolo #{request.id_solicitacao} · {labels[request.status] ?? request.status}</p>
      {request.motivo_decisao && <p className="mt-1 break-words">{request.motivo_decisao}</p>}
      {ongoing && <p className="mt-1 text-muted-foreground">Sua conta segue ativa durante a análise.</p>}
    </div>}
    {!resource.loading && !resource.error && !ongoing && <Modal open={open} onOpenChange={next => {
      if (working) return;
      setOpen(next);
      setError('');
      setConfirmation('');
    }} trigger={<Button variant="outline" className="text-destructive">Solicitar exclusão</Button>}
        title="Solicitar exclusão da conta" description="A equipe analisa o pedido e as pendências comerciais. Se aprovado, seus dados de perfil serão removidos ou anonimizados e suas sessões serão encerradas. Registros comerciais serão preservados.">
      <form className="grid gap-3" onSubmit={submit}>
        <label className="grid gap-1 text-sm">Senha atual<input className="min-h-11 rounded border border-border bg-background px-3" type="password" name="password" autoComplete="current-password" required /></label>
        <label className="grid gap-1 text-sm">Código de autenticação, se habilitado<input className="min-h-11 rounded border border-border bg-background px-3" name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" /></label>
        <label className="grid gap-1 text-sm">Digite EXCLUIR para confirmar<input className="min-h-11 rounded border border-border bg-background px-3" value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="destructive" disabled={working || confirmation !== 'EXCLUIR'}>{working ? 'Enviando…' : 'Enviar solicitação'}</Button>
      </form>
    </Modal>}
  </div>;
}
