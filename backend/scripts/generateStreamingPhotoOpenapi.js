import {readFile,writeFile} from 'node:fs/promises';
import {streamingPhotoOperations} from '../src/routes/streamingPhotoRoutes.js';
const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
const obj=properties=>({type:'object',additionalProperties:false,properties,required:Object.keys(properties)});
for(const r of streamingPhotoOperations){
 const op={operationId:r.operationId,tags:['Perfis de streaming'],summary:{upload:'Enviar ou substituir foto própria',read:'Ler foto privada do perfil',remove:'Remover foto e usar avatar padrão'}[r.action],security:[{bearerAuth:[]}],description:'Somente CLIENTE ativo, dono da conta/perfil; perfil alheio retorna 404. Foto privada, sem URL pública; leitura exige Bearer. Upload multipart no campo image, um JPEG/PNG/WebP estático até 5 MiB, até 16 milhões de pixels e 8192 pixels por lado. Reencoda sem metadados para WebP de até 512 pixels e 256 KiB. Substitui a foto anterior; remoção idempotente. Avatar padrão permanece e é usado quando photoUrl é null. Sem alteração de direitos de acesso. Escritas auditadas na transação; proprietário revalidado após processamento. Cache-Control private, no-store. Upload concluído pode persistir se a conexão cair após commit; consultar novamente.',parameters:[{name:'id',in:'path',required:true,schema:{type:'string',pattern:'^[1-9][0-9]{0,9}$'}}],responses:{}};
 if(r.action==='upload'){
 op.requestBody={required:true,content:{'multipart/form-data':{schema:obj({image:{type:'string',format:'binary'}})}}};
 op.responses['200']={description:'Foto substituída',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data:obj({photoUrl:{type:'string'},width:{type:'integer',minimum:1,maximum:512},height:{type:'integer',minimum:1,maximum:512},bytes:{type:'integer',minimum:1,maximum:262144}}),requestId:{type:'string',format:'uuid'}})}}};
 }else if(r.action==='read')op.responses['200']={description:'Imagem privada normalizada',content:{'image/webp':{schema:{type:'string',format:'binary'}}}};
 else op.responses['204']={description:'Foto ausente; perfil e avatar preservados'};
 for(const [code,name] of Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))op.responses[code]={$ref:'#/components/responses/'+name};
 op.responses['415']={description:'Mídia inválida, animada ou não suportada'};op.responses['408']={description:'Upload interrompido'};
 (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,JSON.stringify(spec,null,2)+'\n');
