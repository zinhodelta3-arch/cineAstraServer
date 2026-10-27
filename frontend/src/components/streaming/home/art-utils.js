export const PALETTES = [
  { bg1: "#353323", bg2: "#14130b", a: "#fad241", b: "#971d00", t: "#ece1dc" }, // 0 dourado
  { bg1: "#7c1029", bg2: "#1b0710", a: "#fad241", b: "#ece1dc", t: "#ece1dc" }, // 1 vinho
  { bg1: "#971d00", bg2: "#2a0d05", a: "#fad241", b: "#ece1dc", t: "#ece1dc" }, // 2 vermelho
  { bg1: "#14130b", bg2: "#353323", a: "#971d00", b: "#fad241", t: "#fad241" }, // 3 noite
  { bg1: "#fad241", bg2: "#971d00", a: "#14130b", b: "#ece1dc", t: "#ece1dc" }, // 4 amarelo
  { bg1: "#ece1dc", bg2: "#7c1029", a: "#14130b", b: "#971d00", t: "#ece1dc" }, // 5 creme
  { bg1: "#0e3b43", bg2: "#061a1e", a: "#f4a259", b: "#5bc0be", t: "#ece1dc" }, // 6 petróleo
  { bg1: "#1b2a49", bg2: "#0b1222", a: "#f6c667", b: "#e4572e", t: "#ece1dc" }, // 7 marinho
  { bg1: "#1f3d2b", bg2: "#0b1a11", a: "#f2e8a0", b: "#7fb069", t: "#f2e8a0" }, // 8 floresta
  { bg1: "#3b1f5c", bg2: "#150a24", a: "#ff8fab", b: "#fad241", t: "#ece1dc" }, // 9 ameixa
  { bg1: "#c8742c", bg2: "#4a1f08", a: "#fbe3b0", b: "#14130b", t: "#fbe3b0" }, // 10 areia
  { bg1: "#cfe3ee", bg2: "#2d4a63", a: "#14202b", b: "#ffffff", t: "#ffffff" }, // 11 gelo
];

export const seeded = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return () => (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
};

export const wrapTitle = (t) => {
  const lines = [];
  let cur = "";
  for (const w of t.toUpperCase().split(" ")) {
    if ((cur + " " + w).trim().length > 11 && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
};
