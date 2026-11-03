// Troque esta rota se a home do streaming estiver em outro endereço.
export const STREAMING_PATH = "/streaming/home";
export const MAX_PROFILES = 5;
export const AVATARS = [
  { id: "astronauta", name: "Astronauta", color: "#9c343e" },
  { id: "gato", name: "Gato cósmico", color: "#718077" },
  { id: "lua", name: "Lua de cinema", color: "#716483" },
  { id: "pipoca", name: "Pipoca", color: "#c28c43" },
  { id: "fantasma", name: "Fantasma cinéfilo", color: "#597c86" },
  { id: "robo", name: "Robô projetor", color: "#897d59" },
  { id: "raposa", name: "Raposa", color: "#bb6950" },
  { id: "estrela", name: "Estrela", color: "#ac737f" },
];
export function avatarSource(profile) {
  return profile.photo || `/streaming/avatars/${profile.avatar}.svg`;
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
// O arquivo é validado e convertido em uma foto quadrada pequena antes de salvar.
export function readProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return reject(new Error("Escolha uma imagem JPG, PNG ou WebP."));
    if (file.size > 5 * 1024 * 1024) return reject(new Error("A foto deve ter até 5 MB."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível abrir a foto."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Este arquivo não pôde ser lido como imagem."));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 400;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Seu navegador não conseguiu processar a foto.");
          const side = Math.min(img.width, img.height);
          ctx.fillStyle = "#353323";
          ctx.fillRect(0, 0, 400, 400);
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 400, 400);
          resolve(canvas.toDataURL("image/jpeg", 0.86));
        } catch { reject(new Error("Não foi possível processar a foto. Tente outra imagem.")); }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
