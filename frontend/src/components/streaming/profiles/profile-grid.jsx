import { MAX_PROFILES, avatarSource } from "./profile-data";
import ProfileIcon from "./profile-icon";

export default function ProfileGrid({ profiles, managing, ready, entering, activeId, select, openEditor }) {
  return (
      <div className="sp-profiles" aria-label={managing ? "Gerenciar perfis" : "Escolher um perfil"} aria-busy={!ready}>
        {profiles.map((profile, index) => <button type="button" className="sp-profile" key={profile.id} onClick={(e) => select(profile, e.currentTarget)} aria-label={managing ? `Editar perfil ${profile.name}` : `Assistir como ${profile.name}`} disabled={!ready || entering} style={{ "--sp-delay": `${index * 65}ms` }}>
          <span className="sp-frame"><span className="sp-frame-perf" aria-hidden="true" /><img src={avatarSource(profile)} alt="" className="sp-profile-img" /><span className="sp-frame-number" aria-hidden="true">0{index + 1}</span>{profile.kids && <span className="sp-kids-badge">KIDS</span>}<span className="sp-hover-screen"><span className="sp-play-circle"><ProfileIcon name={managing ? "edit" : "play"} /></span></span><span className="sp-frame-bottom" aria-hidden="true" /></span>
          <span className="sp-profile-info"><span className="sp-profile-name">{profile.name}</span>{managing ? <span className="sp-profile-caption">Editar perfil <ProfileIcon name="edit" /></span> : <span className="sp-profile-caption">{activeId === profile.id ? "Último acesso" : profile.kids ? "Pequenos espectadores" : "Seu lugar na primeira fila"}</span>}</span>
        </button>)}
        {profiles.length < MAX_PROFILES && <button type="button" className="sp-profile sp-add-profile" onClick={(e) => openEditor(null, e.currentTarget)} disabled={!ready || entering} style={{ "--sp-delay": `${profiles.length * 65}ms` }} aria-label="Adicionar perfil"><span className="sp-add-frame"><span className="sp-add-plus"><ProfileIcon name="plus" /></span><span className="sp-add-cross sp-add-cross-one" aria-hidden="true" /><span className="sp-add-cross sp-add-cross-two" aria-hidden="true" /></span><span className="sp-profile-info"><span className="sp-profile-name">Novo perfil</span><span className="sp-profile-caption">Mais uma boa história</span></span></button>}
      </div>
  );
}
