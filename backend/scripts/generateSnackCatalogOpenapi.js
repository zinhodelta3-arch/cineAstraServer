import {readFile,writeFile} from 'node:fs/promises';
import {snackCatalogOperations} from '../src/routes/snackCatalogRoutes.js';
const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
const obj=properties=>({type:'object',additionalProperties:false,properties,required:Object.keys(properties)}),id={type:'string',pattern:'^[1-9][0-9]{0,9}$'},str={type:'string',nullable:true};
spec.components.schemas.PublicSnack=obj({id,localId:id,name:{type:'string'},description:str,category:str,publishedPrice:{type:'string',pattern:'^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$'},currency:{type:'string',enum:['BRL']},inStock:{type:'boolean'},imageUrl:str,purchaseKind:{type:'string',enum:['INPUT']}});
const ref={$ref:'#/components/schemas/PublicSnack'},tag='Bomboniere pública';spec.tags=[...spec.tags.filter(t=>t.name!==tag),{name:tag}];
for(const r of snackCatalogOperations){
 const op={operationId:r.operationId,tags:[tag],summary:r.action==='list'?'Listar produtos avulsos da unidade':'Consultar produto avulso da unidade',security:[],description:'Consulta pública de insumos com venda_avulsa=true e DISPONIVEL em local ativo, com fornecedor ativo, usuário FORNECEDOR ativo e vínculo fornecedor/local ativo. Mesma visibilidade no detalhe. Estoque livre considera reservas; retorna apenas booleano, sem quantidades/custos/fornecedor. Sem filtro inStock inclui esgotados. publishedPrice é o preço cadastrado, não cotação final. Carrinho deve cotar e revalidar no checkout autenticado como INPUT. Lista de unidade inativa/inexistente é vazia; detalhe não visível ou de outra unidade retorna 404. Não reserva nem cobra.',parameters:[{name:'localId',in:'path',required:true,schema:id}],responses:{}};
 let data=ref;
 if(r.action==='list'){
 op.parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:id},{name:'q',in:'query',schema:{type:'string',minLength:1,maxLength:150}},{name:'category',in:'query',schema:{type:'string',minLength:1,maxLength:100}},{name:'inStock',in:'query',schema:{type:'boolean'}});
 data=obj({items:{type:'array',items:ref},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})});
 }else op.parameters.push({name:'id',in:'path',required:true,schema:id});
 op.responses['200']={description:'Sucesso; paginação por ID crescente, cursor exclusivo',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}};
 for(const [code,name] of Object.entries({400:'BadRequest',404:'NotFound',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))op.responses[code]={$ref:`#/components/responses/${name}`};
 (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,JSON.stringify(spec,null,2)+'\n');console.info('Bomboniere: 2 operações documentadas.');
