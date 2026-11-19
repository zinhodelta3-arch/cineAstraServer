const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatBrl = value => formatter.format(Number(value));

export function priceForApi(value, maxWholeDigits = 8) {
  const text = value.trim().replace(/^R\$\s*/, '');
  const match = /^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/.exec(text)
    ?? /^(\d+)\.(\d{1,2})$/.exec(text);
  if (!match) return null;
  const reais = match[1].replaceAll('.', '').replace(/^0+(?=\d)/, '');
  return reais.length <= maxWholeDigits ? `${reais}.${(match[2] ?? '').padEnd(2, '0')}` : null;
}
