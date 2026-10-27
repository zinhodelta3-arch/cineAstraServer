import {success} from '../utils/dto.js';
export function createSnackCatalogController(service){return {
    list:async(req,res)=>success(res,await service.list(req.params.localId,req.snackQuery)),
    get:async(req,res)=>success(res,await service.get(req.params.localId,req.params.id))
};}
