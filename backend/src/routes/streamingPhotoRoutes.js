import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {streamingProfileId} from '../validators/streamingProfileValidators.js';
import {ApiError} from '../utils/ApiError.js';

const photoPath = '/api/streaming/profiles/{id}/photo';
export const streamingPhotoOperations = [{ method:'get', action:'read' }, { method:'delete', action:'remove' }]
    .map(route => ({ ...route, path:photoPath, operationId:route.action+'_streaming_profile_photo' }));

export function streamingPhotoRoutes(controller, {auth, limits}) {
    const router = Router();
    const path = photoPath.replace('{id}', ':id');
    router.put(path, (req, res) => {
        res.set({ Allow:'GET, DELETE', 'Cache-Control':'private, no-store' });
        throw new ApiError('Escolha um avatar oficial do CineAstra.', 405, null, 'PROFILE_PHOTO_UPLOAD_DISABLED');
    });
    const privateResponse = (req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); };
    router.get(path, privateResponse, auth, allowRoles('CLIENTE'), streamingProfileId, controller.read);
    router.delete(path, privateResponse, auth, allowRoles('CLIENTE'), streamingProfileId, ...limits.upload, controller.remove);
    return router;
}
