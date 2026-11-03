import { ApiError } from '../utils/ApiError.js';
import { randomUUID } from 'node:crypto';

// Contrato do adaptador real: tokenize({setupReference,type,userId,signal}) retorna
// {provider,token,brand,last4}; os demais métodos usam IDs opacos do gateway.
// O adaptador deve obter o token no gateway, nunca aceitar PAN/CVV nesta API.
export function unavailablePaymentProvider() {
    const unavailable = async () => { throw ApiError.indisponivel(); };
    return { name: null, available: false, tokenize: unavailable, create: unavailable, consult: unavailable,
        cancel: unavailable, refund: unavailable, consultRefund: unavailable, verifyWebhook: unavailable };
}

export function simulatedPaymentProvider() {
    return {
        name: 'simulado', available: true,
        async tokenize({ setupReference, type }) {
            const match = /^sim:(CREDITO|DEBITO|PIX):(\d{4}):[a-f0-9-]{36}$/.exec(setupReference ?? '');
            if (!match || type !== match[1] || (type === 'PIX' && match[2] !== '0000')) throw ApiError.validacao('Método de pagamento inválido');
            return { provider: 'simulado', token: `sim_${randomUUID()}`, brand: type === 'PIX' ? 'Pix' : 'Cartao', last4: match[2] };
        },
        async create({ intentionId }) { return { transactionId: `sim-${intentionId}` }; },
        async consult({ intentionId, amount, transactionId }) {
            return { eventId: `sim-approved-${intentionId}`, intentionId, status: 'APROVADO',
                currency: 'BRL', amount, transactionId: transactionId || `sim-${intentionId}`,
                occurredAt: new Date().toISOString() };
        },
        async verifyWebhook() { return null; }
    };
}
