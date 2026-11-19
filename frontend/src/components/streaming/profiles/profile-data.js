export const STREAMING_PATH = "/streaming/home";
export const MAX_PROFILES = 5;
export const AVATARS = [
  { id:"astronauta", name:"Astronauta da sessão" },
  { id:"gato", name:"Gato de óculos 3D" },
  { id:"lua", name:"Lua de cinema" },
  { id:"pipoca", name:"Pipoca da estreia" },
  { id:"fantasma", name:"Fantasma cinéfilo" },
  { id:"robo", name:"Robô projetor" },
  { id:"raposa", name:"Raposa diretora" },
  { id:"estrela", name:"Estrela do cinema" },
];
export const DEFAULT_AVATAR = AVATARS[0].id;
const avatarIds = new Set(AVATARS.map(({ id }) => id));

export function officialAvatar(id) {
  return avatarIds.has(id) ? id : DEFAULT_AVATAR;
}

export function avatarSource(id) {
  return `/streaming/avatars/${officialAvatar(id)}.webp`;
}

export function validateName(value, profiles, editingId) {
  const name = value.trim();
  if (!name) return "Escreva um nome para o perfil.";
  if (name.length > 24) return "Use um nome com até 24 caracteres.";
  if (profiles.some((p) => p.id !== editingId && p.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
    return "Já existe um perfil com esse nome.";
  }
  return "";
}
