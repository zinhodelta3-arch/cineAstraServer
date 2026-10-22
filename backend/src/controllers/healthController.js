import { success } from '../utils/dto.js';

export function createHealthController(service) {
    return {
        live(req, res) { return success(res, service.live()); },
        async ready(req, res) { return success(res, await service.ready({ signal: req.signal })); },
        async legacyHealth(req, res) {
            await service.ready({ signal: req.signal });
            return res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
        },
        root(req, res) { return success(res, { name: 'CineAstra API', version: '1.0.0' }); }
    };
}
