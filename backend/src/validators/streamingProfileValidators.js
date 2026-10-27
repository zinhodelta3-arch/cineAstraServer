import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
export const profileAvatars=['astronauta','gato','lua','pipoca','fantasma','robo','raposa','estrela'];
const name=z.string().transform(v=>v.normalize('NFC').trim()).pipe(z.string().min(1).max(24).regex(/^[^\u0000-\u001f\u007f]+$/));
const fields={name,avatar:z.enum(profileAvatars),kids:z.boolean()};
export const streamingProfileSchemas={
    create:z.object({...fields,avatar:fields.avatar.default('astronauta'),kids:fields.kids.default(false)}).strict(),
    patch:z.object(fields).partial().strict().refine(v=>Object.keys(v).length>0),
    select:z.object({}).strict().default({})
};
export function streamingProfileId(req,res,next){
    const id=req.params.id;
    if(!/^[1-9]\d{0,9}$/.test(id)||BigInt(id)>4294967295n)throw ApiError.validacao('ID de perfil inválido');
    next();
}
