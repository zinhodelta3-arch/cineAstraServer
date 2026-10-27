import {readFile,writeFile} from 'node:fs/promises';
import {streamingProgressOperations} from '../src/routes/streamingProgressRoutes.js';
const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
const obj=properties=>({type:'object',additionalProperties:false,properties,...(Object.keys(properties).length?{required:Object.keys(properties)}:{})});
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$'},cursor={type:'string',maxLength:60,description:'Cursor retornado pelo servidor: timestamp UTC ISO com milissegundos, underscore e ID do progresso. Enviar sem alterações.'};
const progress=obj({filmId:id,positionSeconds:{type:'integer',minimum:0,maximum:4294967295},durationSeconds:{type:'integer',minimum:1,maximum:4294967295},completed:{type:'boolean'},version:{type:'integer',minimum:1,maximum:4294967295},updatedAt:{type:'string',format:'date-time'},catalogAvailable:{type:'boolean'},title:{type:'string',nullable:true}});
spec.components.schemas.StreamingProgress=progress;
spec.components.schemas.StreamingProgressInput=obj({positionSeconds:{type:'integer',minimum:0,maximum:4294967295},expectedVersion:{type:'integer',minimum:0,maximum:4294967294,description:'0 para criar; versão devolvida pela consulta/gravação anterior para atualizar. Conflito retorna 409.'}});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const response=data=>({description:'Sucesso',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
const tag='Progresso de streaming';spec.tags=[...spec.tags.filter(t=>t.name!==tag),{name:tag,description:'Histórico resumido e continuar assistindo por perfil.'}];
for(const r of streamingProgressOperations){
 const op={operationId:r.operationId,tags:[tag],summary:r.operationId.replaceAll('_',' '),security:[{bearerAuth:[]}],description:'Somente CLIENTE proprietário do perfil; perfil alheio/inexistente retorna 404. Progresso informado pelo cliente, não comprova reprodução nem concede direitos. Duração vem de filmes.duracao em minutos, convertida para segundos. Conclusão a partir de 95%; posição zero/reinício permite assistir novamente. Salvar exige filme ativo/disponível para streaming, versão atual e posição dentro da duração. Histórico guarda um resumo por filme, não eventos de cada sessão. Filmes fora do catálogo ficam no histórico com title null; continuar assistindo os exclui, assim como concluídos e posição zero. DELETE remove progresso/histórico do filme, idempotente. Exclusão do perfil remove em cascata. Atualizações concorrentes usam versão (PROGRESS_VERSION_CONFLICT).',parameters:[{name:'profileId',in:'path',required:true,schema:id}],responses:{}};
 if(['history','continuing'].includes(r.action)){
  op.parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:cursor});
  op.responses['200']=response(obj({profileId:id,items:{type:'array',items:ref('StreamingProgress')},pagination:obj({limit:{type:'integer'},nextCursor:{...cursor,nullable:true}})}));
 }else{
  op.parameters.push({name:'filmId',in:'path',required:true,schema:id});
  if(r.action==='remove'){op.responses['204']={description:'Progresso removido; sem corpo'};op.requestBody={required:false,content:{'application/json':{schema:obj({})}}};}
  else op.responses['200']=response(ref('StreamingProgress'));
  if(r.action==='save')op.requestBody={required:true,content:{'application/json':{schema:ref('StreamingProgressInput'),example:{positionSeconds:120,expectedVersion:0}}}};
 }
 for(const [code,name] of Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))op.responses[code]={$ref:`#/components/responses/${name}`};
 (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,JSON.stringify(spec,null,2)+'\n');console.info('Progresso: 5 operações documentadas.');
