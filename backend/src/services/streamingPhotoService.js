import sharp from 'sharp';
import {ApiError} from '../utils/ApiError.js';
import {normalizeImage,checkUploadSignal,IMAGE_LIMITS} from './imageProcessor.js';
export async function normalizeProfilePhoto(file,signal){
 const normalized=await normalizeImage(file,signal);
 const {data,info}=await sharp(normalized.buffer).resize(512,512,{fit:'inside',withoutEnlargement:true}).webp({quality:80,effort:3}).toBuffer({resolveWithObject:true});
 checkUploadSignal(signal);
 if(data.length>262144)throw new ApiError('Foto excede o limite normalizado',413,null,'PAYLOAD_TOO_LARGE');
 return {buffer:data,width:info.width,height:info.height};
}
export function createStreamingPhotoService({model,identity,processor=normalizeProfilePhoto}){
 let active=0;
 const own=(id,ctx,fn)=>identity.transaction(async c=>{const actor=await identity.activeActor(c,ctx);if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();if(!await model.own(c,String(actor.id_usuario),id))throw ApiError.naoEncontrado();return fn(c);},ctx);
 return {
 acquire(){if(active>=IMAGE_LIMITS.concurrency)throw new ApiError('Uploads ocupados; tente novamente',503,null,'UPLOAD_BUSY');active++;let done=false;return ()=>{if(!done){done=true;active--;}};},
 authorize:(id,ctx)=>own(id,ctx,async()=>{}),
 async upload(id,file,ctx){await own(id,ctx,async()=>{});const image=await processor(file,ctx.signal);return own(id,ctx,async c=>{checkUploadSignal(ctx.signal);await model.put(c,id,image);await identity.audit(c,'STREAMING_PROFILE.PHOTO_UPDATED',id,ctx);return {photoUrl:`/api/streaming/profiles/${id}/photo`,width:image.width,height:image.height,bytes:image.buffer.length};});},
 read:(id,ctx)=>own(id,ctx,async c=>{const photo=await model.get(c,id);if(!photo)throw ApiError.naoEncontrado();return photo.imagem;}),
 remove:(id,ctx)=>own(id,ctx,async c=>{await model.remove(c,id);await identity.audit(c,'STREAMING_PROFILE.PHOTO_REMOVED',id,ctx);})
 };
}
