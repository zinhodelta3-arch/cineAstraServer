const fields='p.id_progresso,p.id_filme,p.posicao_segundos,p.duracao_segundos,p.concluido,p.versao,p.atualizado_em,f.titulo,f.status,f.disponivel_streaming';
const from=' FROM streaming_progresso p JOIN filmes f ON f.id_filme=p.id_filme';
const one=async(c,sql,args)=>(await c.execute(sql,args))[0][0]??null;
export function createStreamingProgressModel(){return {
    profile:(c,owner,id)=>one(c,'SELECT id_perfil FROM streaming_perfis WHERE id_usuario=? AND id_perfil=?',[owner,id]),
    film:(c,id)=>one(c,'SELECT id_filme,duracao,status,disponivel_streaming FROM filmes WHERE id_filme=? FOR UPDATE',[id]),
    get:(c,profileId,filmId)=>one(c,`SELECT ${fields}${from} WHERE p.id_perfil=? AND p.id_filme=?`,[profileId,filmId]),
    save:(c,profileId,filmId,data,exists)=>exists
        ?c.execute('UPDATE streaming_progresso SET posicao_segundos=?,duracao_segundos=?,concluido=?,versao=versao+1,atualizado_em=UTC_TIMESTAMP(3) WHERE id_perfil=? AND id_filme=?',[data.position,data.duration,data.completed,profileId,filmId])
        :c.execute('INSERT INTO streaming_progresso(id_perfil,id_filme,posicao_segundos,duracao_segundos,concluido,atualizado_em) VALUES(?,?,?,?,?,UTC_TIMESTAMP(3))',[profileId,filmId,data.position,data.duration,data.completed]),
    async remove(c,profileId,filmId){const [r]=await c.execute('DELETE FROM streaming_progresso WHERE id_perfil=? AND id_filme=?',[profileId,filmId]);return r.affectedRows>0;},
    async list(c,profileId,{limit,cursor},continuing){
        const where=['p.id_perfil=?'],args=[profileId];
        if(continuing)where.push("p.concluido=FALSE","p.posicao_segundos>0","f.status='ATIVO'","f.disponivel_streaming=TRUE");
        if(cursor){const [date,id]=cursor.split('_'),sqlDate=date.replace('T',' ').replace('Z','');where.push('(p.atualizado_em<? OR (p.atualizado_em=? AND p.id_progresso<?))');args.push(sqlDate,sqlDate,id);}
        args.push(limit+1);
        return (await c.execute(`SELECT ${fields}${from} WHERE ${where.join(' AND ')} ORDER BY p.atualizado_em DESC,p.id_progresso DESC LIMIT ?`,args))[0];
    }
};}
