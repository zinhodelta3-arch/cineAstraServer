export const SECTIONS = [
  { value: "em-cartaz", label: "Em cartaz" },
  { value: "em-breve", label: "Em breve" },
];
export const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export const durationLabel = (minutes) => !minutes ? "Duração a confirmar" : `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`;
