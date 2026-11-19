import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { EnvironmentValidationError, loadEnvironment } from './config/env.js';
import { runtimeConfig } from './config/runtime.js';
import { createDatabase } from './config/database.js';
import { createApp } from './app.js';
import { simulatedPaymentProvider } from './providers/paymentProvider.js';
import { brevoNewsletterEmailProvider } from './providers/newsletterEmailProvider.js';
import { createLogModel } from './models/logModel.js';
import { createLogQueue } from './services/logService.js';
import { createLogRetention } from './jobs/logRetention.js';
import { createCheckoutExpiry } from './jobs/checkoutExpiry.js';
import {createSubscriptionBillingJob} from './jobs/subscriptionBilling.js';
import {createNewsletterDeliveryJob} from './jobs/newsletterDelivery.js';
import {createSupportLiveExpiry} from './jobs/supportLiveExpiry.js';
import { report, startRuntimeMonitor } from './utils/telemetry.js';

export async function startServer(config, overrides = {}) {
    const database = overrides.database ?? createDatabase(config.db);
    const model = createLogModel(database);
    const queue = overrides.logQueue ?? createLogQueue(log => model.insert(log), { limit: config.logging.queueLimit });
    const retention = overrides.retention ?? createLogRetention(model, config.logging);
    const lifecycle = { stopping: false };
    const startup = new AbortController();
    let app;
    let server, closeApp, monitor, shutdown, startWorkers;
    const workers = [{ name: 'log_retention', job: retention }];

    async function startWorkersWhenDatabaseReady() {
        const { signal } = startup;
        let waiting = false;
        while (!signal.aborted) {
            try {
                await database.ping({ signal });
                break;
            } catch (error) {
                if (signal.aborted) return;
                if (!waiting) {
                    report('workers_waiting_for_database', { error });
                    waiting = true;
                }
                try { await delay(2000, undefined, { signal, ref: false }); }
                catch (error) { if (signal.aborted) return; throw error; }
            }
        }
        if (signal.aborted) return;
        for (const { job } of workers) job.start();
        if (waiting) report('workers_started_after_database_ready');
    }

    const close = () => {
        shutdown ??= (async () => {
            lifecycle.stopping = true;
            startup.abort();
            monitor?.close();
            const deadline = Date.now() + config.shutdownTimeout;
            // Reserve parte do prazo para drenar logs e fechar o pool após o HTTP.
            const force = setTimeout(() => server?.closeAllConnections(), Math.max(1, Math.floor(config.shutdownTimeout / 2)));
            let failed = false;
            const release = async (resource, operation) => {
                try { await operation(); }
                catch (error) { failed = true; report('shutdown_resource_failed', { resource, error }); }
            };
            try {
                // Sinalize todos os workers antes de aguardar qualquer um deles.
                await Promise.all([
                    release('http', () => new Promise((resolve, reject) => {
                        if (!server?.listening) return resolve();
                        server.close(error => error ? reject(error) : resolve());
                        server.closeIdleConnections();
                    })),
                    release('worker_startup', () => startWorkers),
                    ...workers.map(({ name, job }) => release(name, () => job.close()))
                ]);
                await release('log_queue', () => queue.close({ timeoutMs: Math.max(0, deadline - Date.now() - config.db.timeout) }));
                await release('application', () => closeApp?.());
                await release('database', () => database.close());
                if (failed) throw new Error('Encerramento incompleto');
            } finally { clearTimeout(force); }
        })();
        return shutdown;
    };
    try {
        const newsletterEmailProvider = overrides.newsletterEmailProvider ?? (config.newsletterBrevo ? brevoNewsletterEmailProvider(config.newsletterBrevo) : undefined);
        app = createApp({ config, database, logQueue: queue, retention, lifecycle, identityProviders: overrides.identityProviders, captchaProvider: overrides.captchaProvider, paymentProvider: overrides.paymentProvider ?? (config.paymentMode === 'SIMULATED' ? simulatedPaymentProvider() : undefined), streamingProvider: overrides.streamingProvider, newsletterEmailProvider, assistantProvider: overrides.assistantProvider, ipcaProvider: overrides.ipcaProvider, storeFactory: overrides.storeFactory, registerCleanup: cleanup => { closeApp = cleanup; } });
        server = createServer(app);
        server.requestTimeout = config.httpTimeout;
        server.headersTimeout = Math.min(config.httpTimeout, 5000);
        server.keepAliveTimeout = 5000;
        server.setTimeout(config.httpTimeout, socket => socket.destroy());
        await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.port, config.host, () => { server.removeListener('error', reject); resolve(); }); });
        const checkoutExpiry=createCheckoutExpiry(app.locals.checkout);
        const subscriptionBilling=createSubscriptionBillingJob(app.locals.billing);
        const newsletterDelivery=createNewsletterDeliveryJob(app.locals.newsletterDelivery);
        const supportLiveExpiry=createSupportLiveExpiry(app.locals.support);
        workers.push({ name: 'checkout_expiry', job: checkoutExpiry }, { name: 'subscription_billing', job: subscriptionBilling },
            { name: 'support_live_expiry', job: supportLiveExpiry });
        if (app.locals.newsletterDeliveryEnabled) workers.push({ name: 'newsletter_delivery', job: newsletterDelivery });
        startWorkers = startWorkersWhenDatabaseReady().catch(error => report('worker_startup_failed', { error }));
        monitor = startRuntimeMonitor();
        return { server, app, lifecycle, close };
    } catch (error) {
        try { await close(); } catch { /* Cada falha de limpeza já foi registrada; preserve a causa inicial. */ }
        throw error;
    }
}

async function main() {
    let runtime;
    // Observa falhas fatais sem impedir a saída padrão do Node nem continuar em estado inválido.
    process.on('uncaughtExceptionMonitor', (error, origin) => report('process_fatal_error', { error, reason: origin }));
    process.once('exit', exitCode => report('process_exited', { exitCode }));
    try {
        loadEnvironment();
        const config = runtimeConfig();
        runtime = await startServer(config);
        console.info('CineAstra API iniciada; consulte /ready para prontidão.');
        report('server_started');
        let stopping = false;
        const stop = reason => {
            if (stopping) return;
            stopping = true;
            report('shutdown_requested', { reason });
            const force = setTimeout(() => { report('shutdown_timeout'); process.exit(1); }, config.shutdownTimeout);
            runtime.close().then(() => { clearTimeout(force); report('shutdown_completed'); process.exitCode = 0; }, error => { report('shutdown_failed', { error }); process.exit(1); });
        };
        process.once('SIGINT', () => stop('SIGINT'));
        process.once('SIGTERM', () => stop('SIGTERM'));
    } catch (error) {
        if (error instanceof EnvironmentValidationError) {
            report('startup_failed_check_environment', { fields: error.fields });
        } else {
            report('startup_failed', { error });
        }
        process.exitCode = 1;
    }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
