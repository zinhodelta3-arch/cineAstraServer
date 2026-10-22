import SwaggerParser from '@apidevtools/swagger-parser';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { infrastructureOperations } from '../src/routes/infrastructureRoutes.js';
import { identityOperations } from '../src/routes/identityRoutes.js';
import { catalogOperations } from '../src/routes/catalogRoutes.js';
import { imageUploadOperations } from '../src/routes/imageUploadRoutes.js';
import { filmGalleryOperations } from '../src/routes/filmGalleryRoutes.js';
import { venueOperations } from '../src/routes/venueRoutes.js';
import { sessionOperations } from '../src/routes/sessionRoutes.js';
import { teamOperations } from '../src/routes/teamRoutes.js';
import { taskOperations } from '../src/routes/taskRoutes.js';
import { notificationOperations } from '../src/routes/notificationRoutes.js';
import { supplierOperations } from '../src/routes/supplierRoutes.js';
import { productOperations } from '../src/routes/productRoutes.js';
import { comboOperations } from '../src/routes/comboRoutes.js';
import { commerceGalleryOperations } from '../src/routes/commerceGalleryRoutes.js';
import { inventoryOperations } from '../src/routes/inventoryRoutes.js';
import { supplyOperations } from '../src/routes/supplyRoutes.js';
import { pricingOperations } from '../src/routes/pricingRoutes.js';
import { paymentMethodOperations } from '../src/routes/paymentMethodRoutes.js';
import { paymentOperations } from '../src/routes/paymentRoutes.js';
import { refundOperations } from '../src/routes/refundRoutes.js';
import { orderOperations } from '../src/routes/orderRoutes.js';
import { ticketOperations } from '../src/routes/ticketRoutes.js';
import { streamingOperations } from '../src/routes/streamingRoutes.js';
import { planOperations } from '../src/routes/planRoutes.js';
import { participationOperations } from '../src/routes/participationRoutes.js';
import { newsletterOperations } from '../src/routes/newsletterRoutes.js';
import { newsletterCampaignOperations } from '../src/routes/newsletterCampaignRoutes.js';
import { newsletterDeliveryOperations } from '../src/routes/newsletterDeliveryRoutes.js';
import { supportOperations } from '../src/routes/supportRoutes.js';
import { contentOperations } from '../src/routes/contentRoutes.js';
import { reportOperations } from '../src/routes/reportRoutes.js';

export async function validateOpenapi() {
    const spec = JSON.parse(await readFile(new URL('../src/docs/openapi.json', import.meta.url), 'utf8'));
    await SwaggerParser.validate(structuredClone(spec));
    const ids = new Set();
    const operations = Object.entries(spec.paths).flatMap(([path, methods]) => Object.entries(methods).map(([method, op]) => ({ path, method, op })));
    const registered = [...infrastructureOperations, ...identityOperations, ...catalogOperations, ...imageUploadOperations, ...filmGalleryOperations, ...venueOperations, ...sessionOperations, ...teamOperations, ...taskOperations, ...notificationOperations, ...supplierOperations, ...productOperations, ...comboOperations, ...commerceGalleryOperations, ...inventoryOperations, ...supplyOperations, ...pricingOperations, ...paymentMethodOperations, ...paymentOperations, ...refundOperations, ...orderOperations, ...ticketOperations, ...streamingOperations, ...planOperations, ...participationOperations, ...newsletterOperations, ...newsletterCampaignOperations, ...newsletterDeliveryOperations, ...supportOperations, ...contentOperations, ...reportOperations];
    if (operations.length !== registered.length) throw new Error(`OpenAPI diverge das rotas registradas: ${operations.length}/${registered.length}`);
    for (const route of registered) {
        const op = spec.paths[route.path]?.[route.method];
        if (!op || op.operationId !== route.operationId || ids.has(op.operationId) || !op.tags?.length || !op.responses || !Array.isArray(op.security)) throw new Error('Contrato OpenAPI inválido');
        ids.add(op.operationId);
    }
    return spec;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await validateOpenapi();
    console.info('OpenAPI 3.0.3 válido; infraestrutura, identidade, catálogo, uploads, galerias, locais, sessões, equipes, chamados, notificações, fornecedores, produtos, combos, estoque, suprimentos, precificação, pagamentos, reembolsos, carrinho, tickets, streaming, planos, participação, newsletter, campanhas, entrega e suporte conferidos.');
}
