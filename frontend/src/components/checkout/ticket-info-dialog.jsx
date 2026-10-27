import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { brl } from "./ticket-state.mjs";

export default function TicketInfoDialog({ info, changeInfoOpen, closeInfo }) {
  return (
      <Dialog open={Boolean(info)} onOpenChange={changeInfoOpen}><DialogContent className="ca-checkout-modal"><DialogHeader><span className="ca-eyebrow"><CreditCard size={16} aria-hidden="true" /> ANTES DE ESCOLHER</span><DialogTitle>{info?.name}</DialogTitle><DialogDescription>{info?.description}</DialogDescription></DialogHeader><div className="ca-modal-price">{info && brl(info.price)} <span>por pessoa</span></div><Button className="ca-modal-dismiss" onClick={closeInfo}>Entendi <Check size={16} aria-hidden="true" /></Button></DialogContent></Dialog>
  );
}
