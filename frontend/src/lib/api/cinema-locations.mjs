export const venueTypes = {
 CINEMA:'Cinema', DRIVE_IN:'Drive-in', SALAO_EVENTOS:'Salão de eventos', ESTACIONAMENTO:'Estacionamento',
 ESTADIO:'Estádio', PRACA:'Praça', ESPACO_PUBLICO:'Espaço público', OUTRO:'Outro espaço'
};
export const eventSeatingLabels = { NUMERADO:'Lugares numerados', LIVRE:'Lugares livres' };

export function cinemaLocation(row){
 const street=[row.logradouro,row.numero,row.complemento].filter(Boolean).join(', ');
 const district=[row.bairro,row.cidade,row.estado].filter(Boolean).join(' · ');
 return {id:String(row.id_local),name:row.nome,type:venueTypes[row.tipo_local]??venueTypes.CINEMA,
 eventCapacity:row.lotacao_eventos,eventSeating:eventSeatingLabels[row.acesso_eventos],
 street:street||'Endereço não informado',district,cep:row.cep,phone:row.telefone,city:row.cidade,fullAddress:[street,district,row.cep?`CEP ${row.cep}`:null].filter(Boolean).join(', ')};
}
