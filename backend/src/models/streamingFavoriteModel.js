const one=async(c,sql,args)=>(await c.execute(sql,args))[0][0]??null;
export function createStreamingFavoriteModel(){return {
    profile:(c,owner,id)=>one(c,'SELECT id_perfil FROM streaming_perfis WHERE id_usuario=? AND id_perfil=?',[owner,id]),
    film:(c,id)=>one(c,'SELECT id_filme,status,disponivel_streaming FROM filmes WHERE id_filme=? FOR UPDATE',[id]),
    existing:(c,profileId,filmId)=>one(c,'SELECT id_favorito FROM streaming_favoritos WHERE id_perfil=? AND id_filme=?',[profileId,filmId]),
    add:(c,profileId,filmId)=>c.execute('INSERT INTO streaming_favoritos(id_perfil,id_filme) VALUES(?,?)',[profileId,filmId]),
    async remove(c,profileId,filmId){const [result]=await c.execute('DELETE FROM streaming_favoritos WHERE id_perfil=? AND id_filme=?',[profileId,filmId]);return result.affectedRows>0;},
    async list(c,profileId,{limit,cursor}){
        const args=[profileId],before=cursor?' AND fav.id_favorito<?':'';
        if(cursor)args.push(cursor);
        args.push(limit+1);
        return (await c.execute(`SELECT fav.id_favorito,fav.id_filme,fav.criado_em,
            f.titulo,f.duracao,f.classificacao,f.status,f.disponivel_streaming
            FROM streaming_favoritos fav JOIN filmes f ON f.id_filme=fav.id_filme
            WHERE fav.id_perfil=?${before} ORDER BY fav.id_favorito DESC LIMIT ?`,args))[0];
    }
};}
