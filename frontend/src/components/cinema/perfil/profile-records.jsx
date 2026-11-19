"use client";
import { useState } from 'react';
import { maskCep, maskPhone } from '@/lib/br-fields.mjs';
import useProfileRecords from '@/hooks/cinema/perfil/use-profile-records';
import {Button} from '@/components/ui/button';
import Modal from './modal';
import Field from './field';
import ListStatus from '@/components/cinema/home/list-status';
const titles={addresses:'Meus endereços',contacts:'Meus contatos','payment-methods':'Métodos de pagamento'};
const contactLabels={TELEFONE:'Telefone',WHATSAPP:'WhatsApp',EMAIL_SECUNDARIO:'E-mail secundário'};
const addressFields=[['cep','CEP',false,9],['logradouro','Logradouro',true,150],['numero','Número',true,20],['complemento','Complemento',false,100],['bairro','Bairro',false,100],['cidade','Cidade',true,100],['estado','Estado (UF)',true,2]];

function ContactFields({ editor, editing, pending }) {
 const [type, setType] = useState(editor.tipo || 'TELEFONE');
 const phone = type !== 'EMAIL_SECUNDARIO';
 return <>
  <label className="block text-sm">Tipo<select name="tipo" value={type} onChange={event => setType(event.target.value)} disabled={pending || editing} className="mt-2 block w-full rounded-lg border border-border bg-background p-3">{Object.entries(contactLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
  <Field label={contactLabels[type]} id="record-valor" name="valor" type={phone ? 'tel' : 'email'} autoComplete={phone ? 'tel' : 'email'}
   placeholder={phone ? '(11) 99999-9999' : undefined} defaultValue={editor.valor || ''} minLength={3} maxLength={phone ? 20 : 150} required disabled={pending}
   onChange={phone ? event => { event.currentTarget.value = maskPhone(event.currentTarget.value); } : undefined} />
 </>;
}
export default function ProfileRecords({kind}){
 const s=useProfileRecords(kind),wallet=kind==='payment-methods';
 return <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{titles[kind]}</h2><div className="flex gap-2"><Button variant="ghost" disabled={s.pending||s.list.loading} onClick={s.list.retry}>Atualizar</Button>{!wallet&&<Button variant="outline" disabled={s.pending} onClick={()=>s.openEditor()}>Adicionar</Button>}</div></div>
  {s.notice&&<p role="status" className="mt-4 text-sm text-primary">{s.notice}</p>}
  {s.error&&!s.editor&&!s.removing&&<p role="alert" className="mt-4 text-sm text-destructive">{s.error}</p>}
  <ul className="mt-4 space-y-3">{s.list.items.map(item=><li key={s.idOf(item)} className="rounded-xl border border-border p-4">
   <p className="break-words font-semibold">{wallet?item.identification:kind==='contacts'?contactLabels[item.tipo]:item.logradouro+', '+item.numero}</p>
   <p className="mt-1 break-words text-sm text-muted-foreground">{wallet?item.type:kind==='contacts'?item.valor:[item.complemento,item.bairro,item.cidade,item.estado,item.cep].filter(Boolean).join(' · ')}</p>
   {item.principal&&<p className="mt-2 text-xs font-bold text-primary">Principal</p>}
   <div className="mt-3 flex flex-wrap gap-2">
    {!wallet&&<Button variant="outline" size="sm" disabled={s.pending} onClick={()=>s.openEditor(item)}>Editar</Button>}
    {!item.principal&&<Button variant="outline" size="sm" disabled={s.pending} onClick={()=>s.makePrimary(item)}>Tornar principal</Button>}
    <Button variant="ghost" size="sm" disabled={s.pending} onClick={()=>s.openRemoval(item)}>Remover</Button>
   </div>
  </li>)}</ul>
  <ListStatus list={s.list} empty="Nenhum registro cadastrado." more="Carregar mais registros" />
  {wallet&&<p className="mt-3 text-xs leading-5 text-muted-foreground">Adicionar um novo cartão depende da integração segura com o provedor de pagamento. Esta página exibe apenas os métodos já cadastrados.</p>}
  <Modal open={s.editor!==null} onOpenChange={open=>{if(!open)s.closeEditor();}} title={s.editor&&s.idOf(s.editor)?'Editar registro':'Adicionar registro'} description={titles[kind]}>
   {s.editor&&<form onSubmit={s.save} className="space-y-4">
    {kind==='addresses'?<div className="grid gap-4 sm:grid-cols-2">{addressFields.map(([name,label,required,max])=><Field key={name} label={label} id={'record-'+name} name={name} defaultValue={name==='cep'?maskCep(s.editor.cep):s.editor[name]||''} required={required} maxLength={max} pattern={name==='estado'?'[A-Z]{2}':name==='cep'?'[0-9]{5}-[0-9]{3}':undefined} disabled={s.pending} inputMode={name==='cep'?'numeric':undefined} placeholder={name==='cep'?'00000-000':undefined} autoComplete={name==='cep'?'postal-code':undefined} onChange={name==='cep'?event=>{event.currentTarget.value=maskCep(event.currentTarget.value);}:undefined} />)}</div>:<ContactFields editor={s.editor} editing={Boolean(s.idOf(s.editor))} pending={s.pending} />}
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="principal" defaultChecked={Boolean(s.editor.principal)} disabled={s.pending} />Definir como principal</label>
    {s.error&&<p role="alert" className="text-sm text-destructive">{s.error}</p>}
    <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={s.pending} onClick={s.closeEditor}>Cancelar</Button><Button type="submit" disabled={s.pending}>Salvar registro</Button></div>
   </form>}
  </Modal>
  <Modal open={s.removing!==null} onOpenChange={open=>{if(!open)s.closeRemoval();}} title="Remover registro?" description="Confirme a remoção deste registro da sua conta.">
   {s.error&&<p role="alert" className="text-sm text-destructive">{s.error}</p>}
   <div className="flex justify-end gap-3"><Button variant="outline" disabled={s.pending} onClick={s.closeRemoval}>Cancelar</Button><Button disabled={s.pending} onClick={s.remove}>Confirmar remoção</Button></div>
  </Modal>
 </section>;
}
