import {ApiError} from '../utils/ApiError.js';

export function createStreamingPhotoService({model, identity}) {
    const own = (id, context, work) => identity.transaction(async c => {
        const actor = await identity.activeActor(c, context);
        if (actor.tipo_usuario !== 'CLIENTE') throw ApiError.acessoNegado();
        if (!await model.own(c, String(actor.id_usuario), id)) throw ApiError.naoEncontrado();
        return work(c);
    }, context);

    return {
        read: (id, context) => own(id, context, async c => {
            const photo = await model.get(c, id);
            if (!photo) throw ApiError.naoEncontrado();
            return photo.imagem;
        }),
        remove: (id, context) => own(id, context, async c => {
            await model.remove(c, id);
            await identity.audit(c, 'STREAMING_PROFILE.PHOTO_REMOVED', id, context);
        })
    };
}
