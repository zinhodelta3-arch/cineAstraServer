import useProfilePassword from '@/hooks/cinema/perfil/use-profile-password';
import {Button} from '@/components/ui/button';
import Modal from './modal';
import Field from './field';
export default function PasswordModal(){
 const s=useProfilePassword();
 return <Modal open={s.open} onOpenChange={s.changeOpen} trigger={<Button variant="outline">Alterar senha</Button>} title="Alterar senha" description="Ao confirmar a alteração, suas sessões serão encerradas. Entre novamente com a nova senha.">
  <form onSubmit={s.submit} className="space-y-4">
   <Field label="Senha atual" id="current-password" name="current" type="password" autoComplete="current-password" required disabled={s.pending} maxLength={72} />
   <Field label="Nova senha" id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required disabled={s.pending} />
   <Field label="Confirmar nova senha" id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={72} required disabled={s.pending} />
   <p className="text-xs text-muted-foreground">Use pelo menos 12 caracteres, incluindo maiúscula, minúscula, número e símbolo. Limite de 72 bytes.</p>
   <Field label="Código 2FA (somente se habilitado na sua conta)" id="profile-2fa" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" disabled={s.pending} />
   {s.error&&<p role="alert" className="text-sm text-destructive">{s.error}</p>}
   <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={s.pending} onClick={()=>s.changeOpen(false)}>Cancelar</Button><Button type="submit" disabled={s.pending}>Salvar nova senha</Button></div>
  </form>
 </Modal>;
}
