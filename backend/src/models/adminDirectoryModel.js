// Escape LIKE metacharacters explicitly; search text is never SQL syntax.
const pattern=value=>'%'+value.replace(/[!%_]/g,c=>'!'+c)+'%';
export function createAdminDirectoryModel(){return {
 async users(c,q){
  const where=[],args=[];
  if(q.cursor){where.push('u.id_usuario<?');args.push(q.cursor);}
  if(q.userId){where.push('u.id_usuario=?');args.push(q.userId);}
  if(q.role){where.push('u.tipo_usuario=?');args.push(q.role);}
  if(q.status){where.push('u.status=?');args.push(q.status);}
  if(q.q){where.push("(u.nome LIKE ? ESCAPE '!' OR u.email LIKE ? ESCAPE '!')");args.push(pattern(q.q),pattern(q.q));}
  args.push(q.limit+1);
  return (await c.execute(`SELECT u.id_usuario,u.nome,u.email,u.tipo_usuario,u.status,u.data_cadastro FROM usuarios u ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY u.id_usuario DESC LIMIT ?`,args))[0];
 },
 async privacy(c,q){
  const where=[],args=[];
  if(q.cursor){where.push('p.id_solicitacao<?');args.push(q.cursor);}
  if(q.userId){where.push('p.id_usuario=?');args.push(q.userId);}
  if(q.status){where.push('p.status=?');args.push(q.status);}
  if(q.type){where.push('p.tipo=?');args.push(q.type);}
  if(q.q){where.push("(u.nome LIKE ? ESCAPE '!' OR u.email LIKE ? ESCAPE '!')");args.push(pattern(q.q),pattern(q.q));}
  args.push(q.limit+1);
  return (await c.execute(`SELECT p.id_solicitacao,p.id_usuario,p.tipo,p.status,p.criada_em,p.encerrada_em,u.nome,u.email
    FROM solicitacoes_privacidade p JOIN usuarios u ON u.id_usuario=p.id_usuario
    ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY p.id_solicitacao DESC LIMIT ?`,args))[0];
 }
};}
