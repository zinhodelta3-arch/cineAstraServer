import {readFile,writeFile} from 'node:fs/promises';
import {streamingProfileOperations} from '../src/routes/streamingProfileRoutes.js';
import {profileAvatars} from '../src/validators/streamingProfileValidators.js';
const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$',description:'INT UNSIGNED, máximo 4294967295.'};
const fields={name:{type:'string',minLength:1,maxLength:24,description:'Normalizado NFC e aparado; único na conta sem diferenciar maiúsculas/minúsculas. Sem caracteres de controle.'},avatar:{type:'string',enum:profileAvatars,default:'astronauta'},kids:{type:'boolean',default:false,description:'Preferência visual; não constitui autorização parental nem altera permissões de reprodução.'}};
spec.components.schemas.StreamingProfile=obj({id,...fields,selected:{type:'boolean'},photoUrl:{type:'string',nullable:true,description:'Foto privada; buscar com Bearer. null usa avatar padrão.'}});
spec.components.schemas.StreamingProfileCreate=obj(fields,['name']);
spec.components.schemas.StreamingProfilePatch={...obj(fields,[]),minProperties:1};
const ref=n=>({$ref:`#/components/schemas/${n}`});
const response=data=>({
 description:'Sucesso',
 content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}
});
const tag='Perfis de streaming';spec.tags=[...spec.tags.filter(t=>t.name!==tag),{name:tag,description:'Perfis de visualização próprios do cliente, separados da identidade da conta.'}];
for(const r of streamingProfileOperations){
 const op={operationId:r.operationId,tags:[tag],summary:r.operationId.replaceAll('_',' '),security:[{bearerAuth:[]}],description:'Somente CLIENTE com sessão ativa, proprietário obtido pela autenticação. Perfil de outra conta retorna 404. Até cinco perfis, nomes únicos por conta e mínimo de um após a primeira criação. Não cria perfis demonstrativos automaticamente. Primeiro perfil é selecionado; excluir selecionado escolhe o restante com menor ID. Seleção é compartilhada pela conta entre dispositivos. Escritas serializadas pelo lock do usuário. Não concede assinatura, direitos de vídeo ou controle parental. Foto personalizada usa o sub-recurso privado /photo. Favoritos e histórico possuem contratos separados.',parameters:r.path.includes('{id}')?[{name:'id',in:'path',required:true,schema:id}]:[],responses:{}};
 if(r.action==='remove')op.responses['204']={description:'Perfil removido; listar novamente para obter a seleção atual.'};
 else op.responses[r.action==='create'?'201':'200']=response(r.action==='list'?obj({items:{type:'array',maxItems:5,items:ref('StreamingProfile')},activeProfileId:{...id,nullable:true},maxProfiles:{type:'integer',enum:[5]}}):ref('StreamingProfile'));
 if(r.action==='create')op.responses['201'].headers={Location:{description:'Detalhe do perfil criado',schema:{type:'string'}}};
 if(['create','patch','select'].includes(r.action))op.requestBody={required:r.action!=='select',content:{'application/json':{schema:r.action==='select'?obj({}):ref(r.action==='create'?'StreamingProfileCreate':'StreamingProfilePatch')}}};
 for(const [code,name] of Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))op.responses[code]={$ref:`#/components/responses/${name}`};
 (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,JSON.stringify(spec,null,2)+'\n');
console.info('Perfis de streaming: 6 operações documentadas.');
