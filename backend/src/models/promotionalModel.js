export function createPromotionalModel(database){
 const one=async(c,sql,args)=>(await c.execute(sql,args))[0][0]??null;
 const select=`SELECT p.id_conteudo,p.tipo,p.slug,p.ativo,p.dados,p.id_local_evento,p.id_promocao,m.categoria AS promotion_category,
  l.nome AS local_nome,l.tipo_local,l.lotacao_eventos,l.acesso_eventos,l.status AS local_status
  FROM conteudos_promocionais p LEFT JOIN locais l ON l.id_local=p.id_local_evento LEFT JOIN promocoes_precificacao m ON m.id_promocao=p.id_promocao`;
 const visible=`p.ativo=TRUE AND (p.id_local_evento IS NULL OR l.status='ATIVO')
  AND (p.id_promocao IS NULL OR (m.ativo=TRUE AND m.publico_geral=TRUE AND m.inicio<=UTC_TIMESTAMP() AND m.fim>UTC_TIMESTAMP()))`;
 return {
 async list(c,kind,q,admin){
  const args=[kind],where=['p.tipo=?'];
  if(!admin)where.push(visible);
  else if(q.active!==undefined){where.push('p.ativo=?');args.push(q.active);}
  if(q.placement){where.push("JSON_UNQUOTE(JSON_EXTRACT(p.dados,'$.placement'))=?");args.push(q.placement);}
  if(q.cursor){where.push('p.id_conteudo<?');args.push(q.cursor);}
  args.push(q.limit+1);
  return (await (c??database).execute(`${select} WHERE ${where.join(' AND ')} ORDER BY p.id_conteudo DESC LIMIT ?`,args))[0];
 },
 get:(c,kind,id,admin,lock=false)=>one(c??database,`${select} WHERE p.tipo=? AND p.id_conteudo=?${admin?'':` AND ${visible}`}${lock?' FOR UPDATE':''}`,[kind,id]),
 location:(c,id)=>one(c,'SELECT status FROM locais WHERE id_local=? FOR UPDATE',[id]),
 promotion:(c,id)=>one(c,'SELECT categoria,publico_geral FROM promocoes_precificacao WHERE id_promocao=? FOR SHARE',[id]),
 async create(c,kind,input){
  const {slug,active,locationId,promotionId,...data}=input;
  const [r]=await c.execute('INSERT INTO conteudos_promocionais(tipo,slug,ativo,dados,id_local_evento,id_promocao) VALUES(?,?,?,?,?,?)',[kind,slug,active,JSON.stringify(data),locationId??null,promotionId??null]);
  return String(r.insertId);
 },
 async update(c,kind,id,input){
  const {slug,active,locationId,promotionId,...data}=input;
  await c.execute('UPDATE conteudos_promocionais SET slug=?,ativo=?,dados=?,id_local_evento=?,id_promocao=? WHERE tipo=? AND id_conteudo=?',[slug,active,JSON.stringify(data),locationId??null,promotionId??null,kind,id]);
 }
 };
}
