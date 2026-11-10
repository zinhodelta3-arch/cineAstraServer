import { readFile,writeFile } from 'node:fs/promises';
import { supplierTransportOperations } from '../src/routes/supplierTransportRoutes.js';

const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$'},status={type:'string',enum:['ATIVO','INATIVO']};
const object=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const reference=name=>({$ref:`#/components/schemas/${name}`});
const text=(maxLength,nullable=false)=>({type:'string',maxLength,...(nullable?{nullable:true}:{minLength:1})});
const fields={nome:text(120),tipo:text(60),identificacao:text(40,true),observacao:text(2000,true)};
spec.components.schemas.SupplierTransport=object({id_transporte:id,id_fornecedor:id,...fields,status,criado_em:{type:'string'},atualizado_em:{type:'string'}});
spec.components.schemas.SupplierTransportPage=object({items:{type:'array',items:reference('SupplierTransport')},pagination:object({limit:{type:'integer',minimum:1,maximum:100},nextCursor:{...id,nullable:true}})});
for(const {method,path,operationId,action} of supplierTransportOperations){
    const op={operationId,tags:['Fornecedores'],summary:operationId.replaceAll('_',' '),description:'FORNECEDOR ativo autenticado. A empresa é obtida pela sessão; consultas e alterações são limitadas aos seus transportes. DELETE inativa, preservando o cadastro. Identificação é opcional e única dentro do fornecedor; PATCH pode reativar o registro.',security:[{bearerAuth:[]}],parameters:[],responses:{}};
    if(path.includes('{id}'))op.parameters.push({name:'id',in:'path',required:true,schema:id});
    if(action==='list')op.parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:id},{name:'status',in:'query',schema:status},{name:'q',in:'query',schema:text(120)});
    if(method==='post'||method==='patch')op.requestBody={required:true,content:{'application/json':{schema:method==='post'?object(fields,['nome','tipo']):{...object({...fields,status},[]),minProperties:1}}}};
    if(method==='delete')op.responses['204']={description:'Transporte inativado.'};
    else{
        const data=reference(action==='list'?'SupplierTransportPage':'SupplierTransport');
        op.responses[method==='post'?'201':'200']={description:'Sucesso',content:{'application/json':{schema:object({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}};
    }
    for(const [code,name] of Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[path]??={})[method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info('Contratos dos transportes próprios atualizados.');
