"use client";

import useStreamingProfiles from "@/hooks/streaming/profiles/use-streaming-profiles";
import { Button } from "@/components/ui/button";
import { MAX_PROFILES, avatarSource } from "./profile-data";
import ProfileIcon from "./profile-icon";
import Modal from "./profile-modal";
import ProfileEditor from "./profile-editor";
import ProfileGrid from "./profile-grid";
import "./profiles.css";

export default function ProfilesClient({ onSelectProfile, showHeader = true }) {
  const { profiles, ready, managing, editor, deleting, deleteError, notice, activeId, entering, logoAvailable, pageRef, returnFocus, manageRef, openEditor, save, remove, select, toggleManaging, closeEditor, dismissNotice, logoFailed, requestDelete, cancelDelete } = useStreamingProfiles(onSelectProfile);
  return <main ref={pageRef} className={`sp-root sp-page ${managing ? "sp-managing" : ""}`}>
    <div className="sp-grain" aria-hidden="true" /><div className="sp-orbit sp-orbit-one" aria-hidden="true" /><div className="sp-orbit sp-orbit-two" aria-hidden="true" />
    {showHeader && <header className="sp-header"><a href="/streaming/home" className="sp-brand" aria-label="CineAstra, página inicial">{logoAvailable ? <img src="/CineAstras.png" alt="CineAstra" onError={logoFailed} /> : <><ProfileIcon name="star" /><span>Cine<span>Astra</span></span></>}<span className="sp-brand-divider" /><span className="sp-brand-streaming">STREAMING</span></a><div className="sp-header-tag"><span /> A SUA SESSÃO COMEÇA AQUI</div></header>}
    <section className="sp-main" aria-labelledby="sp-title">
      <div className="sp-scene-label"><span className="sp-scene-line" /><ProfileIcon name="film" /><span>{managing ? "NOS BASTIDORES" : "LUZ, CÂMERA... VOCÊ."}</span><span className="sp-scene-line" /></div>
      <h1 id="sp-title" className="sp-title">{managing ? <>CADA PERFIL,<br /><em>UMA HISTÓRIA.</em></> : <>QUEM VAI<br /><em>DAR O PLAY?</em></>}</h1>
      <p className="sp-subtitle">{managing ? "Escolha um perfil para editar. Deixe cada espaço com a sua cara." : "O mesmo universo. Um jeito só seu de assistir."}</p>
      <ProfileGrid profiles={profiles} managing={managing} ready={ready} entering={entering} activeId={activeId} select={select} openEditor={openEditor} />
      <div className="sp-manage-area"><Button ref={manageRef} className={`sp-btn ${managing ? "sp-btn-primary" : "sp-btn-outline"}`} variant={managing ? "default" : "outline"} disabled={!ready || entering} onClick={toggleManaging}><ProfileIcon name={managing ? "check" : "edit"} />{managing ? "Concluir edição" : "Gerenciar perfis"}</Button><span className="sp-profile-count">{String(profiles.length).padStart(2, "0")} / 0{MAX_PROFILES} PERFIS</span></div>
      <p className="sp-personal-note">{entering ? "Preparando sua próxima sessão..." : "Cada perfil guarda seu próprio jeito de viver o cinema."}</p>
    </section>
    <footer className="sp-footer"><span>CINEASTRA <span className="sp-footer-star">✦</span> ALÉM DA TELA</span><div className="sp-footer-perf" aria-hidden="true" /><span>SUA HISTÓRIA. SEU PLAY.</span></footer>
    <div className={`sp-toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite">{notice && <><ProfileIcon name="film" /><span>{notice}</span><button className="sp-icon-button" aria-label="Fechar aviso" onClick={dismissNotice}><ProfileIcon name="close" /></button></>}</div>
    {editor && <ProfileEditor key={editor === "new" ? "new" : editor.id} profile={editor === "new" ? null : editor} profiles={profiles} onClose={closeEditor} onSave={save} returnFocus={returnFocus} onDelete={requestDelete} />}
    {deleting && <Modal open small title="Fim dessa história?" description={`Deseja excluir o perfil ${deleting.name}? A foto e as preferências deste perfil serão removidas deste navegador. Essa ação não pode ser desfeita.`} returnFocus={manageRef} onClose={cancelDelete}>
      <div className="sp-delete-profile"><img src={avatarSource(deleting)} alt="" /><div><strong>{deleting.name}</strong><span>Perfil do streaming</span></div><ProfileIcon name="trash" /></div><p className="sp-error" role="alert">{deleteError}</p><div className="sp-dialog-actions"><Button type="button" className="sp-btn sp-btn-outline" variant="outline" onClick={cancelDelete}>Manter perfil</Button><Button type="button" className="sp-btn sp-btn-destructive" variant="destructive" onClick={remove}><ProfileIcon name="trash" /> Sim, excluir perfil</Button></div>
    </Modal>}
  </main>;
}
