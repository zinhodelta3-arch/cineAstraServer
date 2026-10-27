export const SECTIONS = [
  { value: "em-cartaz", label: "Em cartaz" },
  { value: "pre-venda", label: "Pré-venda" },
  { value: "em-breve", label: "Em breve" },
];
export const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export const durationLabel = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`;
