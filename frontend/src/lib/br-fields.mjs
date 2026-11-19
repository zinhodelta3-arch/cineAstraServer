const digits = value => String(value ?? "").replace(/\D/g, "");

export const maskCpf = value => digits(value).slice(0, 11)
  .replace(/^(\d{3})(\d)/, "$1.$2")
  .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
  .replace(/(\.\d{3})(\d)/, "$1-$2");

export const maskCep = value => digits(value).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");

export const maskCnpj = value => String(value ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 14)
  .replace(/^(\w{2})(\w)/, "$1.$2")
  .replace(/^(\w{2}\.\w{3})(\w)/, "$1.$2")
  .replace(/^(\w{2}\.\w{3}\.\w{3})(\w)/, "$1/$2")
  .replace(/(\/\w{4})(\w)/, "$1-$2");

export function maskPhone(value) {
  const text = String(value ?? "").trimStart();
  const international = text.startsWith("+");
  const number = digits(text);
  if (international && !number.startsWith("55")) return text;
  const prefix = international ? "+55" : "";
  const national = (international ? number.slice(2) : number).slice(0, 11);
  if (!national) return prefix;
  if (national.length <= 2) return [prefix, national].filter(Boolean).join(" ");
  const subscriber = national.slice(2);
  const split = subscriber.length > 8 ? 5 : 4;
  const formatted = subscriber.length > split ? `${subscriber.slice(0, split)}-${subscriber.slice(split)}` : subscriber;
  return `${prefix ? prefix + " " : ""}(${national.slice(0, 2)}) ${formatted}`;
}
