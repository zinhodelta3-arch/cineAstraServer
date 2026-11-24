export function cinemaProgram(film, today = new Date().toISOString().slice(0, 10)) {
  const announced = Boolean(film.data_lancamento && film.data_lancamento.slice(0, 10) > today);
  const onSale = film.venda_disponivel === true;
  if (announced) return { status: onSale ? 'pre-venda' : 'em-breve', label: onSale ? 'Pré-venda' : 'Em breve', onSale };
  return { status: 'em-cartaz', label: onSale ? 'Ingressos disponíveis' : 'No catálogo', onSale };
}
