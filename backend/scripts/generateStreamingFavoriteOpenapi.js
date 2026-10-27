import {readFile,writeFile} from 'node:fs/promises';
import {streamingFavoriteOperations} from '../src/routes/streamingFavoriteRoutes.js';
const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
const obj=properties=>({type:'object',additionalProperties:false,properties,...(Object.keys(properties).length?{required:Object.keys(properties)}:{})});
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$',description:'INT UNSIGNED, máximo 4294967295.'},big={type:'string',pattern:'^[1-9][0-9]{0,19}$',description:'BIGINT UNSIGNED, máximo 18446744073709551615.'};
const film={...obj({title:{type:'string'},duration:{type:'integer',nullable:true},classification:{type:'string',nullable:true}}),nullable:true};
const item=obj({id:big,filmId:id,addedAt:{type:'string',format:'date-time'},catalogAvailable:{type:'boolean'},film});
spec.components.schemas.StreamingFavorite=item;
const tag='Favoritos de streaming';spec.tags=[...spec.tags.filter(t=>t.name!==tag),{name:tag,description:'Minha lista por perfil de visualização.'}];
for(const r of streamingFavoriteOperations){
 const op={operationId:r.operationId,tags:[tag],summary:r.operationId.replaceAll('_',' '),security:[{bearerAuth:[]}],description:'Somente CLIENTE proprietário do perfil. Perfil inexistente ou de outra conta retorna 404. Perfil é explícito, não depende da seleção global. PUT e DELETE são idempotentes e retornam 204. Novo favorito exige filme ativo e disponível para streaming; existente permanece mesmo após saída do catálogo e pode ser removido. Listagem decrescente por ID de favorito, cursor exclusivo; catálogo indisponível retorna film null. catalogAvailable não concede acesso de reprodução nem representa controle parental. Não expõe URL de vídeo, comprador ou pedido. Excluir perfil remove seus favoritos em cascata.',parameters:[{name:'profileId',in:'path',required:true,schema:id}],responses:{}};
 if(r.action==='list'){
  op.parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:big});
  op.responses['200']={description:'Página própria; nextCursor null indica fim',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data:obj({profileId:id,items:{type:'array',items:{$ref:'#/components/schemas/StreamingFavorite'}},pagination:obj({limit:{type:'integer',minimum:1,maximum:100},nextCursor:{...big,nullable:true}})}),requestId:{type:'string',format:'uuid'}})}}};
 }else{
  op.parameters.push({name:'filmId',in:'path',required:true,schema:id});op.responses['204']={description:'Estado solicitado aplicado; sem corpo'};
  op.requestBody={required:false,content:{'application/json':{schema:obj({})}}};
 }
 for(const [code,name] of Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))op.responses[code]={$ref:`#/components/responses/${name}`};
 (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,JSON.stringify(spec,null,2)+'\n');
console.info('Favoritos: 3 operações documentadas.');
