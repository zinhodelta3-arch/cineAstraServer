export function createPromotionalModel(database){
 const one=async(c,sql,args)=>(await c.execute(sql,args))[0][0]??null;
 return {
 async list(c,kind,q,admin){const args=[kind],where=['tipo=?'];if(!admin||q.active!==undefined){where.push('ativo=?');args.push(admin?q.active:true);}if(q.placement){where.push("JSON_UNQUOTE(JSON_EXTRACT(dados,'$.placement'))=?");args.push(q.placement);}if(q.cursor){where.push('id_conteudo<?');args.push(q.cursor);}args.push(q.limit+1);return (await (c??database).execute(`SELECT id_conteudo,tipo,slug,ativo,dados FROM conteudos_promocionais WHERE ${where.join(' AND ')} ORDER BY id_conteudo DESC LIMIT ?`,args))[0];},
 get:(c,kind,id,admin,lock=false)=>one(c??database,`SELECT id_conteudo,tipo,slug,ativo,dados FROM conteudos_promocionais WHERE tipo=? AND id_conteudo=?${admin?'':' AND ativo=TRUE'}${lock?' FOR UPDATE':''}`,[kind,id]),
 async create(c,kind,input){const {slug,active,...data}=input;const [r]=await c.execute('INSERT INTO conteudos_promocionais(tipo,slug,ativo,dados) VALUES(?,?,?,?)',[kind,slug,active,JSON.stringify(data)]);return String(r.insertId);},
 async update(c,kind,id,input){const {slug,active,...data}=input;await c.execute('UPDATE conteudos_promocionais SET slug=?,ativo=?,dados=? WHERE tipo=? AND id_conteudo=?',[slug,active,JSON.stringify(data),kind,id]);}
 };
}
