const context = req => ({ actor:req.usuario, signal:req.signal, requestId:req.res.locals.requestId });

export function createStreamingPhotoController(service) {
    return {
        async read(req, res) {
            const image = await service.read(req.params.id, context(req));
            res.set({
                'Content-Type':'image/webp',
                'X-Content-Type-Options':'nosniff',
                'Content-Security-Policy':"default-src 'none'; sandbox",
                'Content-Disposition':'inline; filename="profile.webp"'
            });
            res.send(image);
        },
        async remove(req, res) {
            await service.remove(req.params.id, context(req));
            res.sendStatus(204);
        }
    };
}
