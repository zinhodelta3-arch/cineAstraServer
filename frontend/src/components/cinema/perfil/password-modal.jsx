import useProfilePassword from "@/hooks/cinema/perfil/use-profile-password";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { actionClass } from "./profile-utils";
import Modal from "./modal";
import Field from "./field";

export default function PasswordModal({ onSuccess }) {
  const { open, error, submit, changeOpen } = useProfilePassword(onSuccess);
  return <Modal open={open} onOpenChange={changeOpen} trigger={<Button variant="ghost" className="h-9 justify-start rounded-full px-3 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />Alterar senha</Button>} title="Alterar senha" description="Demonstração da interface. Uma alteração real exige integração com a autenticação do CineAstra.">
    <form onSubmit={submit} className="space-y-4"><Field label="Senha atual (fictícia)" id="current-password" name="current" type="password" autoComplete="off" required /><Field label="Nova senha (fictícia)" id="new-password" name="password" type="password" minLength={8} autoComplete="off" required /><Field label="Confirmar nova senha" id="confirm-password" name="confirm" type="password" minLength={8} autoComplete="off" required /><p className="text-[11px] text-muted-foreground">Mínimo de 8 caracteres. As senhas não são salvas ou enviadas.</p>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2 pt-2"><DialogClose render={<Button type="button" variant="outline" className={actionClass}>Cancelar</Button>} /><Button type="submit" className={actionClass}>Validar alteração</Button></div></form>
  </Modal>;
}
