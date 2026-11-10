import { createHash } from 'node:crypto';
import { rateLimit, ipKeyGenerator, MemoryStore } from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';
import { report } from '../utils/telemetry.js';

export function createLimits(config, storeFactory, registerCleanup) {
    if (config.rateLimitStore === 'external' && !storeFactory) throw new Error('Store compartilhado de rate limit não configurado');
    const stores = [];
    const close = async () => {
        const results = await Promise.allSettled(stores.map(store => Promise.resolve().then(() => store.shutdown?.())));
        const failures = results.filter(result => result.status === 'rejected');
        for (const failure of failures) report('rate_limit_shutdown_failed', { error: failure.reason });
        if (failures.length) throw new Error('Encerramento incompleto do rate limit');
    };
    // Registre a limpeza antes da criação: uma falha pode ocorrer no meio dos stores.
    registerCleanup?.(close);
    const limiter = (name, max, keyGenerator) => {
        const store = config.rateLimitStore === 'external' ? storeFactory(name) : new MemoryStore();
        if (!store) throw new Error('Store compartilhado de rate limit não configurado');
        stores.push(store);
        return rateLimit({ windowMs: config.rate.windowMs, limit: max, standardHeaders: 'draft-8', legacyHeaders: false,
            store, ...(keyGenerator && { keyGenerator }),
            handler: (req, res, next) => next(new ApiError('Limite de requisições excedido', 429, null, 'RATE_LIMITED')) });
    };
    const ip = req => ipKeyGenerator(req.ip);
    const identity = req => {
        const challenge = typeof req.body?.challengeToken === 'string' && /^[a-f0-9]{64}$/.test(req.body.challengeToken) ? req.body.challengeToken : null;
        const newsletterToken = typeof req.body?.token === 'string' && /^[a-f0-9]{64}$/.test(req.body.token) ? req.body.token : null;
        const key = req.usuario?.id ?? (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : challenge ?? newsletterToken ?? 'anonymous');
        return createHash('sha256').update(key).digest('hex');
    };
    const flows = {};
    for (const [name, max] of Object.entries({ login: 10, register: 10, recovery: 5, twoFactor: 10, checkout: 20, tickets: 30, upload: 10, newsletter: 5, assistant: 20, streamingProgress: 120 })) {
        flows[name] = [limiter(`${name}:ip`, max, ip), limiter(`${name}:identity`, max, identity)];
    }
    return { general: limiter('general', config.rate.max, ip), flows, close };
}
