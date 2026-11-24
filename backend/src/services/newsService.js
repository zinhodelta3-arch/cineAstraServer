import {ApiError} from '../utils/ApiError.js';

const fields='id_noticia, categoria, titulo, resumo, corpo, destaque, publicado_em';
const publicFilter=' AND publicado_em IS NOT NULL AND publicado_em <= UTC_TIMESTAMP(3)';
const dto=row=>({
    id:String(row.id_noticia),
    categoria:row.categoria,
    titulo:row.titulo,
    resumo:row.resumo,
    corpo:row.corpo,
    destaque:Boolean(row.destaque),
    publishedAt:row.publicado_em?.replace(' ','T').replace(/Z?$/,'Z')??null
});

async function find(c,id,{published=false,lock=false}={}){
    const [[row]]=await c.execute(
        `SELECT ${fields} FROM noticias WHERE id_noticia=? AND arquivado_em IS NULL${published?publicFilter:''}${lock?' FOR UPDATE':''}`,[id]);
    if(!row)throw ApiError.naoEncontrado();
    return dto(row);
}

async function list(c,{cursor,limit,category},published){
    const [rows]=await c.execute(
        `SELECT ${fields} FROM noticias WHERE arquivado_em IS NULL AND (?=0 OR id_noticia<?)${published?publicFilter:''}${category?' AND categoria=?':''} ORDER BY id_noticia DESC LIMIT ?`,
        [cursor,cursor,...(category?[category]:[]),limit+1]);
    const items=rows.slice(0,limit).map(dto);
    return {items,pagination:{limit,nextCursor:rows.length>limit?items.at(-1).id:null}};
}

export function createNewsService({database,identity}){
    function admin(context,fn){
        return identity.transaction(async c=>{
            if((await identity.activeActor(c,context)).tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
            return fn(c);
        },context);
    }
    const values=input=>[input.categoria,input.titulo,input.resumo,input.corpo,input.destaque,input.publicar];
    return {
        listPublic:(query,signal)=>database.withConnection(c=>list(c,query,true),{signal}),
        getPublic:(id,signal)=>database.withConnection(c=>find(c,id,{published:true}),{signal}),
        listAdmin:(query,context)=>admin(context,c=>list(c,query,false)),
        save:(id,input,context)=>admin(context,async c=>{
            if(id){
                await find(c,id,{lock:true});
                await c.execute(`UPDATE noticias SET categoria=?, titulo=?, resumo=?, corpo=?, destaque=?,
                    publicado_em=IF(?,COALESCE(publicado_em,UTC_TIMESTAMP(3)),NULL) WHERE id_noticia=?`,[...values(input),id]);
            }else{
                const [result]=await c.execute(`INSERT INTO noticias (categoria,titulo,resumo,corpo,destaque,publicado_em)
                    VALUES (?,?,?,?,?,IF(?,UTC_TIMESTAMP(3),NULL))`,values(input));
                id=String(result.insertId);
            }
            await identity.audit(c,'NEWS.ARTICLE_SAVED',id,context);
            return find(c,id);
        }),
        archive:(id,context)=>admin(context,async c=>{
            await find(c,id,{lock:true});
            await c.execute('UPDATE noticias SET arquivado_em=UTC_TIMESTAMP(3) WHERE id_noticia=?',[id]);
            await identity.audit(c,'NEWS.ARTICLE_ARCHIVED',id,context);
            return {archived:true};
        })
    };
}
