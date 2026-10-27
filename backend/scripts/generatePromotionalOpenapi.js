import {readFile,writeFile} from 'node:fs/promises';
import {promotionalOperations} from '../src/routes/promotionalRoutes.js';
const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$'},text=maxLength=>({type:'string',minLength:1,maxLength}),optional=max=>({...text(max),nullable:true}),placement={type:'string',enum:['cinema-home','streaming-home','astrasnack']};
const shared={slug:{...text(100),pattern:'^[a-z0-9]+(?:-[a-z0-9]+)*$'},title:text(150),summary:text(500),description:optional(5000),imageUrl:{...optional(2048),description:'URL HTTPS sem credenciais ou caminho interno iniciado por /; não aceita //, espaços ou barras invertidas.'},imageAlt:optional(200),targetUrl:{...optional(2048),description:'Mesmas regras de imageUrl; não é buscada pelo servidor.'},ctaLabel:optional(80),tag:optional(80),active:{type:'boolean',default:false}};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const tag='Conteúdo promocional';spec.tags=[...spec.tags.filter(t=>t.name!==tag),{name:tag}];
for(const kind of ['partners','experiences','banners']){
 const properties={...shared,...(kind==='experiences'?{priceLabel:optional(100),unit:optional(150),details:{type:'array',maxItems:20,items:text(250)}}:{}),...(kind==='banners'?{placement}:{})};
 const required=['slug','title','summary',...(kind==='banners'?['placement']:[])];
 spec.components.schemas[kind+'Create']=obj(properties,required);
 spec.components.schemas[kind+'Patch']={...obj({...properties,active:{type:'boolean'}},[]),minProperties:1};
 spec.components.schemas[kind+'Content']=obj({...properties,id},[...required,'active','id']);
}
for(const r of promotionalOperations){
 const ref={$ref:'#/components/schemas/'+r.kind+'Content'},parameters=[];
 if(r.path.includes('{id}'))parameters.push({name:'id',in:'path',required:true,schema:id});
 if(r.action==='list'){
 parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:id});
 if(r.admin)parameters.push({name:'active',in:'query',schema:{type:'boolean'}});
 if(r.kind==='banners')parameters.push({name:'placement',in:'query',schema:placement});
 }
 const data=r.action==='list'?obj({items:{type:'array',items:ref},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})}):ref;
 const op={operationId:r.operationId,tags:[tag],summary:`${r.action} ${r.kind}${r.admin?' (ADMIN)':''}`,description:'Conteúdo editorial em texto simples. Criação inativa por padrão; PATCH active publica/desativa, sem exclusão física. Slug único por tipo. Público recebe apenas ativos; ocultos retornam 404. Lista por ID decrescente, cursor exclusivo; sem cache. Não cria reservas, cupons, preços comerciais nem direitos de acesso. Imagens são URLs, sem upload ou download pelo servidor. Escritas auditadas; validação estrita. ADMIN ativo revalidado no serviço.',security:r.admin?[{bearerAuth:[]}]:[],parameters,responses:{}};
 op.responses[r.action==='create'?'201':'200']={description:'Sucesso',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}};
 if(['create','patch'].includes(r.action))op.requestBody={required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/'+r.kind+(r.action==='create'?'Create':'Patch')}}}};
 for(const [code,name] of Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))if(spec.components.responses[name])op.responses[code]={$ref:'#/components/responses/'+name};
 op.responses['409']={description:'Slug já cadastrado neste tipo: PROMOTIONAL_CONFLICT'};
 (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,JSON.stringify(spec,null,2)+'\n');
