export function createStreamingPhotoModel(){return {
 own:async(c,owner,id)=>(await c.execute('SELECT id_perfil FROM streaming_perfis WHERE id_usuario=? AND id_perfil=?',[owner,id]))[0][0]??null,
 get:async(c,id)=>(await c.execute('SELECT imagem,largura,altura FROM streaming_perfil_fotos WHERE id_perfil=?',[id]))[0][0]??null,
 remove:(c,id)=>c.execute('DELETE FROM streaming_perfil_fotos WHERE id_perfil=?',[id])
};}
