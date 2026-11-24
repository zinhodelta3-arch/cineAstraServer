'use client';

import { useState } from 'react';
import { ChevronDown, Pencil, UserRoundMinus, UserRoundPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { maskCpf, maskPhone } from '@/lib/br-fields.mjs';
import { useUnitAction, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore } from './unit-layout';
import styles from './unit.module.css';

const dialogTitles={create:'Cadastrar colaborador',edit:'Editar conta',deactivate:'Desativar conta'};

export default function UnitCollaboratorAccounts({teamId,teamName,onChange}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [dialog,setDialog]=useState(null);
  const [cpf,setCpf]=useState('');
  const queryParams=new URLSearchParams({limit:'20',...(query&&{q:query})});
  const accounts=useUnitList(open?`/collaborators?${queryParams}`:null);
  const action=useUnitAction(accounts.reload);
  const mode=dialog?.mode;
  const account=dialog?.account;

  function edit(mode,account=null){
    action.setError('');
    setCpf('');
    setDialog({mode,account});
  }
  async function save(event){
    event.preventDefault();
    const fields=new FormData(event.currentTarget);
    const name=String(fields.get('name')??'').trim();
    let saved;
    if(mode==='create'){
      const body={name,email:fields.get('email'),cpf,dateOfBirth:fields.get('dateOfBirth'),funcao:String(fields.get('funcao')??'').trim(),
        password:fields.get('password'),passwordConfirmation:fields.get('passwordConfirmation')};
      saved=await action.run(`/${teamId}/collaborators`,{method:'POST',body},'Conta criada. O convite está disponível no portal do colaborador.');
    }else if(mode==='edit'){
      saved=await action.run(`/collaborators/${account.id}`,{method:'PATCH',body:{name,phone:String(fields.get('phone')??'').trim()||null}},'Conta atualizada.');
    }else{
      saved=await action.run(`/collaborators/${account.id}`,{method:'DELETE'},'Conta desativada. O histórico foi preservado.');
    }
    if(saved){setDialog(null);onChange();}
  }

  return <>
    <details className={`${styles.panel} ${styles.accountPanel}`} open={open} onToggle={event=>setOpen(event.currentTarget.open)}>
      <summary className={styles.panelHeader}>Contas de colaboradores do cinema<ChevronDown size={17} aria-hidden="true" /></summary>
      {open&&<div className={styles.body}>
        <UnitFeedback notice={action.notice} />
        <p className={styles.muted}>O colaborador aparece nesta lista depois que o vínculo com uma equipe do cinema estiver vigente.</p>
        {teamId&&<button type="button" className={`${styles.button} mt-3`} onClick={()=>edit('create')}>
          <UserRoundPlus size={16} aria-hidden="true" />Cadastrar e convidar para a equipe
        </button>}
        <form className={`${styles.form} mt-4`} onSubmit={event=>{
          event.preventDefault();
          const term=String(new FormData(event.currentTarget).get('query')??'').trim();
          if(term===query)accounts.reload();
          else setQuery(term);
        }}>
          <label>Nome do colaborador<input type="search" name="query" maxLength={100} /></label>
          <button type="submit" className={styles.secondary}>Buscar</button>
        </form>
        <UnitListState list={accounts} empty="Nenhuma conta com vínculo vigente para esta busca." />
        {accounts.items.length>0&&<ul className={styles.list}>{accounts.items.map(row=><li key={row.id}>
          <div><strong>{row.name}</strong><small>{row.email}</small></div>
          <div className={styles.row}>
            <button type="button" className={styles.iconButton} title="Editar conta" aria-label={`Editar conta de ${row.name}`} onClick={()=>edit('edit',row)}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" className={styles.iconButton} title="Desativar conta" aria-label={`Desativar conta de ${row.name}`} onClick={()=>edit('deactivate',row)}><UserRoundMinus size={16} aria-hidden="true" /></button>
          </div>
        </li>)}</ul>}
        {accounts.items.length>0&&<UnitMore list={accounts} noun="contas" />}
      </div>}
    </details>
    {dialog&&<Dialog open onOpenChange={value=>{if(!value&&!action.pending)setDialog(null);}}>
      <DialogContent className={styles.accountDialog}>
        <DialogTitle>{dialogTitles[mode]}</DialogTitle>
        <DialogDescription>{mode==='create'?`O convite será enviado para a equipe ${teamName}. O colaborador precisa aceitá-lo no portal.`:
          mode==='deactivate'?`O acesso de ${account.name} será encerrado e as sessões abertas serão revogadas. O histórico será preservado.`:
            `Atualize o nome e o telefone de ${account.name}.`}</DialogDescription>
        <form className={styles.form} onSubmit={save} aria-busy={action.pending}>
          {mode!=='deactivate'&&<label className={styles.full}>Nome completo<input name="name" defaultValue={account?.name??''} minLength={2} maxLength={100} required /></label>}
          {mode==='create'&&<>
            <label>E-mail<input name="email" type="email" maxLength={150} required /></label>
            <label>CPF<input name="cpf" inputMode="numeric" value={cpf} onChange={event=>setCpf(maskCpf(event.target.value))} minLength={14} maxLength={14} required /></label>
            <label>Data de nascimento<input type="date" name="dateOfBirth" required /></label>
            <label>Função na equipe<input name="funcao" maxLength={100} required /></label>
            <label>Senha inicial<input type="password" autoComplete="new-password" name="password" minLength={12} maxLength={72} required /></label>
            <label>Confirmar senha<input type="password" autoComplete="new-password" name="passwordConfirmation" minLength={12} maxLength={72} required /></label>
            <p className={`${styles.muted} ${styles.full}`}>Use pelo menos 12 caracteres, com letras maiúsculas e minúsculas, número e símbolo.</p>
          </>}
          {mode==='edit'&&<label>Telefone<input type="tel" name="phone" maxLength={20} defaultValue={account.phone??''}
            onChange={event=>{event.currentTarget.value=maskPhone(event.currentTarget.value);}} /></label>}
          <div className={`${styles.row} ${styles.full}`}>
            <button type="button" className={styles.secondary} disabled={action.pending} onClick={()=>setDialog(null)}>Voltar</button>
            <button type="submit" className={styles.button} disabled={action.pending}>{action.pending?'Processando…':
              mode==='create'?'Criar conta e convidar':mode==='edit'?'Salvar conta':'Confirmar desativação'}</button>
          </div>
        </form>
        <UnitFeedback error={action.error} />
      </DialogContent>
    </Dialog>}
  </>;
}
