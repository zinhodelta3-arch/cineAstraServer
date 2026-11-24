import useEditProfile from '@/hooks/cinema/perfil/use-edit-profile';
import { maskPhone } from '@/lib/br-fields.mjs';
import {Button} from '@/components/ui/button';
import Modal from './modal';
import Field from './field';
export default function EditProfile({profile,onSave}){
 const s=useEditProfile(profile,onSave);
 return <Modal open={s.open} onOpenChange={s.changeOpen} trigger={<Button variant="outline">Editar perfil</Button>} title="Editar perfil" description="Atualize seus dados de identificação e contato.">
  <form onSubmit={s.submit} className="space-y-4">
   <Field label="Nome completo" id="profile-name" value={s.draft.name} onChange={e=>s.change('name',e.target.value)} minLength={2} maxLength={100} required disabled={s.pending} autoComplete="name" />
   <fieldset className="space-y-2 border-t border-dashed border-border pt-3"><legend className="pr-2 text-sm font-semibold">Contatos</legend>
     <Field label="Telefone (opcional)" id="profile-phone" type="tel" value={s.draft.phone} onChange={e=>s.change('phone',maskPhone(e.target.value))} maxLength={20} disabled={s.pending} autoComplete="tel" placeholder="(11) 99999-9999" />
     <p className="break-words text-sm text-muted-foreground">E-mail da conta · {profile.email}</p>
   </fieldset>
   {s.error&&<p role="alert" className="text-sm text-destructive">{s.error}</p>}
   <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={s.pending} onClick={()=>s.changeOpen(false)}>Cancelar</Button><Button type="submit" disabled={s.pending}>{s.pending?'Salvando…':'Salvar perfil'}</Button></div>
  </form>
 </Modal>;
}
