const labels = {
  FORNECEDOR: 'Com o fornecedor',
  UNIDADE: 'Na unidade',
  EM_ENTREGA: 'Em entrega',
};

export default function EquipmentPosition({ item }) {
  const position = item.posicao ?? (item.id_local ? 'UNIDADE' : 'FORNECEDOR');
  const destination = item.entrega?.nome_local_destino;
  return <>{labels[position]}{destination && <small className="block text-muted-foreground">Destino · {destination}</small>}</>;
}
