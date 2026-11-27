import { experienceRequestsPath, validExperienceId } from '../api/experience-inquiry.mjs';
import { purchaseVerificationPath, validPurchaseReference } from '../api/purchase-reference.mjs';

export function loginDestination(role) {
 if (role === 'ADMIN') return '/admin/dashboard';
 if (role === 'SUPERVISOR' || role === 'COLABORADOR') return '/unidade';
 if (role === 'FORNECEDOR') return '/fornecedor';
 if (role === 'CLIENTE') return '/cinema/home';
 return null;
}
export function checkoutDestination(next) {
 return next === '/cinema/sessao/ingressos' || next === '/cinema/carrinho' ? next : null;
}
export const subscriptionManagementPath = '/cinema/perfil/assinatura';
export function clientLoginDestination(next) {
 if (next === '/cinema/suporte') return next;
 const receiptPrefix = `${purchaseVerificationPath}?referencia=`;
 if (typeof next === 'string' && next.startsWith(receiptPrefix) && validPurchaseReference(next.slice(receiptPrefix.length))) return next;
 if (typeof next === 'string' && /^\/cinema\/experiencias\/solicitar(?:\?experiencia=(?:personalizado|[1-9]\d{0,9}))?$/.test(next)) return next;
 const requestPrefix = `${experienceRequestsPath}?pedido=`;
 if (typeof next === 'string' && next.startsWith(requestPrefix) && validExperienceId(next.slice(requestPrefix.length))) return next;
 return next === subscriptionManagementPath ? next : checkoutDestination(next);
}
export const passwordValid = (password, confirmation) => password === confirmation && password.length >= 12 && new TextEncoder().encode(password).length <= 72 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^a-zA-Z0-9]/.test(password);
