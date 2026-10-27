export function createStreamingPhotoModel(){return {
 own:async(c,owner,id)=>(await c.execute('SELECT id_perfil FROM streaming_perfis WHERE id_usuario=? AND id_perfil=?',[owner,id]))[0][0]??null,
 get:async(c,id)=>(await c.execute('SELECT imagem,largura,altura FROM streaming_perfil_fotos WHERE id_perfil=?',[id]))[0][0]??null,
 put:(c,id,image)=>c.execute('INSERT INTO streaming_perfil_fotos(id_perfil,imagem,largura,altura) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE imagem=VALUES(imagem),largura=VALUES(largura),altura=VALUES(altura)',[id,image.buffer,image.width,image.height]),
 remove:(c,id)=>c.execute('DELETE FROM streaming_perfil_fotos WHERE id_perfil=?',[id])
};}
