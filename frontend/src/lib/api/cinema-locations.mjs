export function cinemaLocation(row){
 const street=[row.logradouro,row.numero,row.complemento].filter(Boolean).join(', ');
 const district=[row.bairro,row.cidade,row.estado].filter(Boolean).join(' · ');
 return {id:String(row.id_local),name:row.nome,type:'Cinema',street:street||'Endereço não informado',district,cep:row.cep,phone:row.telefone,city:row.cidade,fullAddress:[street,district,row.cep?`CEP ${row.cep}`:null].filter(Boolean).join(', ')};
}
