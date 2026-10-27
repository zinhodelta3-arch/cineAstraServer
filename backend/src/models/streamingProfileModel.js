import {idString} from '../utils/dto.js';
const fields='id_perfil,nome,avatar,infantil,selecionado';
export function createStreamingProfileModel(){return {
    list:async(c,owner)=>(await c.execute(`SELECT ${fields},EXISTS(SELECT 1 FROM streaming_perfil_fotos pf WHERE pf.id_perfil=streaming_perfis.id_perfil) AS tem_foto FROM streaming_perfis WHERE id_usuario=? ORDER BY id_perfil`,[owner]))[0],
    async insert(c,owner,data,key){const [result]=await c.execute('INSERT INTO streaming_perfis(id_usuario,nome,nome_chave,avatar,infantil,selecionado) VALUES(?,?,?,?,?,?)',[owner,data.name,key,data.avatar,data.kids,data.selected]);return idString(result.insertId);},
    update:(c,owner,id,data,key)=>c.execute('UPDATE streaming_perfis SET nome=?,nome_chave=?,avatar=?,infantil=? WHERE id_usuario=? AND id_perfil=?',[data.name,key,data.avatar,data.kids,owner,id]),
    remove:(c,owner,id)=>c.execute('DELETE FROM streaming_perfis WHERE id_usuario=? AND id_perfil=?',[owner,id]),
    select:(c,owner,id)=>c.execute('UPDATE streaming_perfis SET selecionado=(id_perfil=?) WHERE id_usuario=?',[id,owner])
};}
