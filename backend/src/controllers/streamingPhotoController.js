import {createImageUpload} from '../middlewares/uploadMiddleware.js';
import {ApiError} from '../utils/ApiError.js';
import {success} from '../utils/dto.js';
import {checkUploadSignal} from '../services/imageProcessor.js';
const parser=createImageUpload().single('image');
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createStreamingPhotoController(service){return {
 async upload(req,res){
  const release=service.acquire();
  try{
   if(!req.is('multipart/form-data'))throw new ApiError('Envie multipart/form-data',415,null,'UNSUPPORTED_MEDIA');
   await service.authorize(req.params.id,context(req));
   await new Promise((resolve,reject)=>{
    const abort=()=>{if(!req.complete)req.destroy();reject(new ApiError('Upload interrompido',408,null,'UPLOAD_ABORTED'));};
    req.signal?.addEventListener('abort',abort,{once:true});
    parser(req,res,error=>{req.signal?.removeEventListener('abort',abort);if(error)reject(error instanceof ApiError||error.name==='MulterError'?error:new ApiError('Multipart inválido',400,null,'INVALID_UPLOAD'));else resolve();});
    if(req.signal?.aborted)abort();
   });
   checkUploadSignal(req.signal);
   return success(res,await service.upload(req.params.id,req.file,context(req)));
  }finally{if(req.file)delete req.file.buffer;release();}
 },
 async read(req,res){const image=await service.read(req.params.id,context(req));res.set({'Content-Type':'image/webp','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Content-Disposition':'inline; filename="profile.webp"'});res.send(image);},
 async remove(req,res){await service.remove(req.params.id,context(req));res.sendStatus(204);}
};}
