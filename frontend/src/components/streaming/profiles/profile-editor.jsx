import useProfileEditor from "@/hooks/streaming/profiles/use-profile-editor";
import { Button } from "@/components/ui/button";
import { AVATARS, avatarSource } from "./profile-data";
import ProfileIcon from "./profile-icon";
import Modal from "./profile-modal";

export default function ProfileEditor({ profile, profiles, onSave, onClose, onDelete, returnFocus }) {
  const { draft, error, photoBusy, fileRef, update, choosePhoto, submit, chooseAvatar, openPhotoPicker } = useProfileEditor(profile, profiles, onSave);
  return <Modal open onClose={onClose} title={profile ? "Esse perfil é a sua cara." : "Uma nova história por aqui."} description={profile ? "Ajuste o nome e escolha quem vai representar você na tela." : "Dê um nome ao perfil e escolha um avatar para começar."} returnFocus={returnFocus}>
    <form onSubmit={submit} noValidate>
      <div className="sp-editor-top">
        <div className="sp-photo-wrap"><img className="sp-editor-photo" src={avatarSource(draft)} alt="Prévia da foto do perfil" /><span className="sp-photo-stamp" aria-hidden="true"><ProfileIcon name="star" /></span></div>
        <div className="sp-editor-field"><label htmlFor="sp-profile-name">Nome do perfil</label><input id="sp-profile-name" className="sp-input" value={draft.name} onChange={(e) => update("name", e.target.value)} maxLength={24} placeholder="Como podemos chamar você?" autoComplete="off" aria-invalid={Boolean(error)} aria-describedby="sp-editor-error sp-name-count" /><span id="sp-name-count" className="sp-field-hint">{draft.name.length}/24 caracteres</span></div>
      </div>
      <div className="sp-section-label"><span>ESCOLHA SEU AVATAR</span><span>01 — 08</span></div>
      <div className="sp-avatar-grid" role="group" aria-label="Avatares disponíveis">
        {AVATARS.map((avatar) => <button className={`sp-avatar-option ${draft.avatar === avatar.id && !draft.photo ? "is-selected" : ""}`} key={avatar.id} type="button" onClick={() => chooseAvatar(avatar.id)} aria-label={avatar.name} aria-pressed={draft.avatar === avatar.id && !draft.photo} disabled={photoBusy} title={avatar.name}>
          <img src={`/streaming/avatars/${avatar.id}.svg`} alt="" />{draft.avatar === avatar.id && !draft.photo && <span className="sp-avatar-check"><ProfileIcon name="check" /></span>}
        </button>)}
      </div>
      <div className="sp-upload-row"><input ref={fileRef} className="sp-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-label="Enviar foto de perfil" /><Button className="sp-btn sp-btn-outline sp-btn-compact" variant="outline" type="button" onClick={openPhotoPicker} disabled={photoBusy}><ProfileIcon name="upload" /> {photoBusy ? "Preparando foto..." : "Enviar minha foto"}</Button><span className="sp-field-hint">JPG, PNG ou WebP · até 5 MB</span></div>
      {draft.photo && <button className="sp-text-button" type="button" onClick={() => update("photo", "")} disabled={photoBusy}>Remover foto e usar avatar</button>}
      <label className="sp-kids-row"><span><strong>Perfil infantil</strong><small>Um espaço com identificação especial para os pequenos.</small></span><input type="checkbox" className="sp-switch-input" checked={draft.kids} onChange={(e) => update("kids", e.target.checked)} /><span className="sp-switch" aria-hidden="true" /></label>
      <p id="sp-editor-error" className="sp-error" role="alert">{error}</p>
      <div className="sp-dialog-actions">
        {profile && <Button className="sp-btn sp-btn-danger-text" variant="ghost" type="button" disabled={profiles.length <= 1 || photoBusy} onClick={onDelete} title={profiles.length <= 1 ? "Mantenha pelo menos um perfil na conta." : undefined}><ProfileIcon name="trash" /> Excluir perfil</Button>}
        <div className="sp-actions-right"><Button className="sp-btn sp-btn-outline" variant="outline" type="button" onClick={onClose}>Cancelar</Button><Button className="sp-btn sp-btn-primary" type="submit" disabled={photoBusy}>{profile ? "Salvar alterações" : "Criar perfil"}<ProfileIcon name="check" /></Button></div>
      </div>
      {profile && profiles.length <= 1 && <p className="sp-field-hint sp-last-hint">Sua conta precisa ter pelo menos um perfil.</p>}
    </form>
  </Modal>;
}
