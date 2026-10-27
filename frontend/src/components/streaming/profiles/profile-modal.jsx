import { Dialog } from "@base-ui/react/dialog";
import ProfileIcon from "./profile-icon";

export default function Modal({ open, onClose, title, description, children, small = false, returnFocus }) {
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="sp-backdrop" />
      <Dialog.Popup className={`sp-root sp-dialog ${small ? "sp-dialog-small" : ""}`} finalFocus={returnFocus}>
        <div className="sp-dialog-perf" aria-hidden="true" />
        <div className="sp-dialog-header">
          <div><p className="sp-eyebrow"><ProfileIcon name="film" /> SEU ESPAÇO NO CINEASTRA</p><Dialog.Title className="sp-dialog-title">{title}</Dialog.Title></div>
          <Dialog.Close className="sp-icon-button" aria-label="Fechar janela"><ProfileIcon name="close" /></Dialog.Close>
        </div>
        <Dialog.Description className="sp-dialog-description">{description}</Dialog.Description>
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
