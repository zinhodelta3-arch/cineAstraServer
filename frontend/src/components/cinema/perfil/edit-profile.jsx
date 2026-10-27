import useEditProfile from "@/hooks/cinema/perfil/use-edit-profile";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { actionClass } from "./profile-utils";
import Modal from "./modal";
import Field from "./field";
import ProfileAvatar from "./profile-avatar";

export default function EditProfile({ profile, onSave }) {
  const { open, draft, error, change, submit, changeOpen } = useEditProfile(profile, onSave);
  return <Modal open={open} onOpenChange={changeOpen} trigger={<Button variant="outline" className={`${actionClass} mt-5 w-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10`}><Pencil className="size-3.5" />Editar perfil</Button>} title="Seu perfil" description="Atualize as informações usadas na sua experiência de cinema.">
    <form onSubmit={submit} className="space-y-5"><Field label="Nome completo" id="profile-name" value={draft.name} onChange={(e) => change("name", e.target.value)} autoComplete="name" required maxLength={80} /><Field label="E-mail" id="profile-email" type="email" value={draft.email} onChange={(e) => change("email", e.target.value)} autoComplete="email" required maxLength={120} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Telefone (opcional)" id="profile-phone" type="tel" value={draft.phone} onChange={(e) => change("phone", e.target.value)} autoComplete="tel" maxLength={20} /><Field label="Cidade (opcional)" id="profile-city" value={draft.city} onChange={(e) => change("city", e.target.value)} autoComplete="address-level2" maxLength={80} /></div>
      <fieldset><legend className="mb-2 text-xs font-semibold text-muted-foreground">Avatar</legend><div className="flex flex-wrap gap-2">{["AM", "film", "star", "ticket"].map((avatar) => <Button type="button" key={avatar} variant="outline" size="icon" aria-label={avatar === "AM" ? "Usar iniciais do nome" : `Usar avatar ${avatar}`} aria-pressed={draft.avatar === avatar} onClick={() => change("avatar", avatar)} className={`size-11 rounded-full ${draft.avatar === avatar ? "border-primary bg-primary/10 text-primary" : ""}`}><ProfileAvatar avatar={avatar} name={draft.name} small /></Button>)}</div></fieldset>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}<p className="text-[11px] text-muted-foreground">Nesta demonstração, as alterações duram até recarregar a página.</p><div className="flex justify-end gap-2 border-t border-border pt-5"><DialogClose render={<Button type="button" variant="outline" className={actionClass}>Cancelar</Button>} /><Button type="submit" className={actionClass}><Check className="size-4" />Salvar alterações</Button></div>
    </form>
  </Modal>;
}
