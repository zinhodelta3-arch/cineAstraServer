import useEditProfile from '@/hooks/cinema/perfil/use-edit-profile';
import {Button} from '@/components/ui/button';
import Modal from './modal';
import Field from './field';
export default function EditProfile({profile,onSave}){
 const s=useEditProfile(profile,onSave);
 return <Modal open={s.open} onOpenChange={s.changeOpen} trigger={<Button variant="outline" className="mt-5 w-full">Editar perfil</Button>} title="Seu perfil" description="Atualize seu nome e telefone.">
  <form onSubmit={s.submit} className="space-y-4">
   <Field label="Nome completo" id="profile-name" value={s.draft.name} onChange={e=>s.change('name',e.target.value)} minLength={2} maxLength={100} required disabled={s.pending} autoComplete="name" />
   <Field label="Telefone (opcional)" id="profile-phone" type="tel" value={s.draft.phone} onChange={e=>s.change('phone',e.target.value)} maxLength={20} disabled={s.pending} autoComplete="tel" />
   <p className="text-xs text-muted-foreground">A troca de e-mail precisa de confirmação e ainda não está disponível nesta página.</p>
   {s.error&&<p role="alert" className="text-sm text-destructive">{s.error}</p>}
   <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={s.pending} onClick={()=>s.changeOpen(false)}>Cancelar</Button><Button type="submit" disabled={s.pending}>{s.pending?'Salvando…':'Salvar perfil'}</Button></div>
  </form>
 </Modal>;
}
