import useAddCard from "@/hooks/cinema/perfil/use-add-card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { actionClass } from "./profile-utils";
import Modal from "./modal";
import Field from "./field";

export default function AddCard({ onAdd }) {
  const { open, error, submit, changeOpen } = useAddCard(onAdd);
  return <Modal open={open} onOpenChange={changeOpen} trigger={<Button variant="outline" className="h-11 w-full rounded-xl border-dashed text-xs text-muted-foreground"><Plus className="size-4" />Adicionar cartão de exemplo</Button>} title="Adicionar cartão" description="Cadastre apenas um identificador fictício para testar a carteira. Nenhuma cobrança é realizada.">
    <form onSubmit={submit} className="space-y-4"><Field label="Apelido" id="card-nickname" name="nickname" placeholder="Ex.: Meu cartão" maxLength={35} /><div className="space-y-2"><label htmlFor="card-brand" className="text-xs font-semibold text-muted-foreground">Bandeira</label><select id="card-brand" name="brand" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"><option>Visa</option><option>Mastercard</option><option>Elo</option><option>American Express</option></select></div><div className="grid grid-cols-2 gap-4"><Field label="Últimos 4 dígitos" id="card-last4" name="last4" placeholder="1234" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required /><Field label="Validade" id="card-expiry" name="expiry" placeholder="MM/AA" inputMode="numeric" pattern="(0[1-9]|1[0-2])/[0-9]{2}" maxLength={5} required /></div><p className="text-[11px] leading-relaxed text-muted-foreground">Use dados fictícios. O protótipo não solicita número completo nem código de segurança.</p>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2 pt-2"><DialogClose render={<Button type="button" variant="outline" className={actionClass}>Cancelar</Button>} /><Button type="submit" className={actionClass}>Adicionar à carteira</Button></div></form>
  </Modal>;
}
