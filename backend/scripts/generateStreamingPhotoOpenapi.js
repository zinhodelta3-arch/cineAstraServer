import {readFile,writeFile} from 'node:fs/promises';
import {streamingPhotoOperations} from '../src/routes/streamingPhotoRoutes.js';

const file=new URL('../src/docs/openapi.json',import.meta.url);
const spec=JSON.parse(await readFile(file,'utf8'));
const photoPath=streamingPhotoOperations[0].path;
delete spec.paths[photoPath]?.put;

for (const route of streamingPhotoOperations) {
    const read=route.action==='read';
    const op={
        operationId:route.operationId, tags:['Perfis de streaming'],
        summary:read?'Ler foto legada do perfil':'Remover foto legada do perfil',
        security:[{bearerAuth:[]}],
        description:'Somente CLIENTE ativo, dono da conta e do perfil. Operação legada; o streaming usa apenas avatares oficiais. Envio de foto retorna 405. Cache-Control private, no-store.',
        parameters:[{name:'id',in:'path',required:true,schema:{type:'string',pattern:'^[1-9][0-9]{0,9}$'}}],
        responses:read
            ? {'200':{description:'Imagem privada normalizada',content:{'image/webp':{schema:{type:'string',format:'binary'}}}}}
            : {'204':{description:'Foto ausente; perfil e avatar preservados'}}
    };
    for (const [code,name] of Object.entries({401:'Unauthorized',403:'Forbidden',404:'NotFound',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'})) {
        op.responses[code]={$ref:'#/components/responses/'+name};
    }
    (spec.paths[photoPath]??={})[route.method]=op;
}
await writeFile(file,JSON.stringify(spec,null,2)+'\n');
