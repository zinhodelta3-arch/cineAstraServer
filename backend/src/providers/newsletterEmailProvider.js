import {createHash,timingSafeEqual} from 'node:crypto';
import {ApiError} from '../utils/ApiError.js';

export function unavailableNewsletterEmailProvider(){return {
    name:null,available:false,
    async assertAvailable(){throw ApiError.indisponivel();},
    async sendConfirmation(){throw ApiError.indisponivel();},
    async sendAuthorization(){throw ApiError.indisponivel();},
    async sendCampaign(){throw ApiError.indisponivel();},
    async verifyBounce(){throw ApiError.indisponivel();}
};}

const deliveryTag = 'cineastra-newsletter';
const actions = { GESTAO: 'gerenciar', DESCADASTRO: 'cancelar' };
const titles = { confirmar: 'Confirme sua inscrição no CineAstraNews', gerenciar: 'Gerencie sua inscrição no CineAstraNews',
    cancelar: 'Confirme o cancelamento do CineAstraNews' };
const digest = value => createHash('sha256').update(value).digest();

function deliveryKey(origin, sender, recipient, id) {
    const bytes = digest(JSON.stringify([origin, sender, recipient.toLowerCase(), id])).subarray(0, 16);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function brevoNewsletterEmailProvider({apiKey,sender,siteOrigin,webhookToken}, request = fetch) {
    const expectedAuthorization = digest(`Bearer ${webhookToken}`);
    const manageUrl = new URL('/cinema/noticias/assinatura', siteOrigin);
    const unsubscribeUrl = new URL(manageUrl);
    unsubscribeUrl.searchParams.set('acao', 'cancelar');

    async function send({email,subject,html,text,signal,idempotencyKey}) {
        const timeout = AbortSignal.timeout(8000);
        let response, body;
        try {
            response = await request('https://api.brevo.com/v3/smtp/email', {
                method:'POST', redirect:'error', signal:signal ? AbortSignal.any([signal,timeout]) : timeout,
                headers:{'api-key':apiKey,'Content-Type':'application/json',Accept:'application/json'},
                body:JSON.stringify({
                    sender:{name:'CineAstraNews',email:sender},to:[{email}],subject,htmlContent:html,textContent:text,
                    tags:[deliveryTag],
                    ...(idempotencyKey && {headers:{IdempotencyKey:idempotencyKey}})
                }),
            });
            body = await response.json();
        } catch {
            throw ApiError.indisponivel();
        }
        if (!response.ok && idempotencyKey && response.status === 400 && body?.code === 'duplicate_parameter') {
            return {accepted:true};
        }
        if (!response.ok || typeof body?.messageId !== 'string' || !body.messageId || body.messageId.length > 255) {
            throw ApiError.indisponivel();
        }
        return {accepted:true,messageId:body.messageId};
    }

    function sendLink(action, {email,token,expiresIn,signal}) {
        const url = new URL(manageUrl);
        url.searchParams.set('acao', action);
        url.hash = new URLSearchParams({token}).toString();
        const subject = titles[action];
        const expiry = expiresIn >= 3600 ? `${Math.floor(expiresIn / 3600)} horas` : `${Math.floor(expiresIn / 60)} minutos`;
        return send({email,subject,signal,
            html:`<p><a href="${url.href}">${subject}</a></p><p>O link expira em ${expiry}.</p><p>Se você não fez esse pedido, ignore esta mensagem.</p>`,
            text:`${subject}\n\n${url.href}\n\nO link expira em ${expiry}. Se você não fez esse pedido, ignore esta mensagem.`});
    }

    return {
        name:'brevo',available:true,
        async assertAvailable() {},
        sendConfirmation:input=>sendLink('confirmar', input),
        sendAuthorization:input=>sendLink(actions[input.purpose], input),
        sendCampaign:input=>send({...input, idempotencyKey:deliveryKey(siteOrigin,sender,input.email,input.idempotencyKey),
            html:`${input.html}<p><a href="${manageUrl.href}">Gerenciar inscrição</a> · <a href="${unsubscribeUrl.href}">Cancelar inscrição</a></p>`,
            text:`${input.text}\n\nGerenciar inscrição: ${manageUrl.href}\nCancelar inscrição: ${unsubscribeUrl.href}`}),
        async verifyBounce({rawBody,headers}) {
            if (typeof headers.authorization !== 'string' ||
                !timingSafeEqual(digest(headers.authorization),expectedAuthorization)) throw ApiError.naoAutorizado();
            let event;
            try { event = JSON.parse(rawBody.toString('utf8')); } catch { throw ApiError.validacao('Evento Brevo inválido'); }
            if (!event || typeof event !== 'object' || Array.isArray(event)) throw ApiError.validacao('Evento Brevo inválido');
            if (!Array.isArray(event.tags) || !event.tags.includes(deliveryTag)) return {verified:true,ignored:true};
            const type = event.event === 'hard_bounce' ? 'BOUNCE' : event.event === 'spam' ? 'COMPLAINT' : null;
            if (!type) return {verified:true,ignored:true};
            if (typeof event['message-id'] !== 'string' || !event['message-id'] || typeof event.email !== 'string') {
                throw ApiError.validacao('Evento Brevo inválido');
            }
            return {verified:true,type,email:event.email,
                eventId:digest(JSON.stringify([type,event['message-id'],event.email.toLowerCase()])).toString('hex')};
        }
    };
}
