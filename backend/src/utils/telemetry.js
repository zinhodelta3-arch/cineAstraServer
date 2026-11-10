import { monitorEventLoopDelay } from 'node:perf_hooks';

// Lista positiva: nunca aceite message/stack/sql/URL/headers/body do erro.
const errorCodes = new Set([
    'ECONNREFUSED','ECONNRESET','ETIMEDOUT','EADDRINUSE','EACCES','EPERM','ENOENT','ENOSPC','EMFILE','ENFILE',
    'ENOTFOUND','EAI_AGAIN','EPIPE','ENOMEM','ABORT_ERR','ERR_SERVER_NOT_RUNNING',
    'ER_ACCESS_DENIED_ERROR','ER_BAD_DB_ERROR','ER_BAD_FIELD_ERROR','ER_NO_SUCH_TABLE',
    'ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT','ER_CON_COUNT_ERROR','ER_TOO_MANY_USER_CONNECTIONS',
    'PROTOCOL_CONNECTION_LOST','INTERNAL_ERROR','DEPENDENCY_UNAVAILABLE','REQUEST_TIMEOUT'
]);
const errorTypes = new Set(['Error','TypeError','ReferenceError','RangeError','SyntaxError','ApiError','EnvironmentValidationError']);
function errorDetails(error) {
    if (error == null) return {};
    try {
        return { errorType: errorTypes.has(error.name) ? error.name : 'Error', errorCode: errorCodes.has(error.code) ? error.code : 'UNCLASSIFIED' };
    } catch { return { errorType: 'Error', errorCode: 'UNCLASSIFIED' }; }
}
const resourceNames = new Set(['http', 'log_retention', 'checkout_expiry', 'subscription_billing', 'newsletter_delivery', 'support_live_expiry', 'log_queue', 'application', 'database']);
const metricNames = ['rssBytes', 'heapUsedBytes', 'heapTotalBytes', 'externalBytes', 'arrayBuffersBytes', 'eventLoopDelayP99Ms'];
export function report(event, { requestId, status, count, error, reason, exitCode, fields, resource, metrics } = {}) {
    const safeReason = ['SIGINT','SIGTERM','uncaughtException','unhandledRejection'].includes(reason) ? reason : null;
    const safeFields = Array.isArray(fields) ? fields.filter(field => typeof field === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(field)).slice(0, 100) : null;
    const safeMetrics = Object.fromEntries(metricNames.filter(key => Number.isFinite(metrics?.[key]) && metrics[key] >= 0).map(key => [key, Math.round(metrics[key])]));
    console.error(JSON.stringify({ event, timestamp: new Date().toISOString(), pid: process.pid,
        ...(requestId && { requestId }), ...(Number.isInteger(status) && { status }), ...(count !== undefined && { count }),
        ...errorDetails(error), ...(safeReason && { reason: safeReason }),
        ...(Number.isInteger(exitCode) && { exitCode }), ...(safeFields && { fields: safeFields }),
        ...(resourceNames.has(resource) && { resource }), ...(Object.keys(safeMetrics).length && { metrics: safeMetrics }) }));
}

export function startRuntimeMonitor() {
    const delay = monitorEventLoopDelay({ resolution: 20 });
    delay.enable();
    const timer = setInterval(() => {
        const memory = process.memoryUsage();
        report('runtime_resources', { metrics: {
            rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, heapTotalBytes: memory.heapTotal,
            externalBytes: memory.external, arrayBuffersBytes: memory.arrayBuffers,
            eventLoopDelayP99Ms: delay.percentile(99) / 1e6
        } });
        delay.reset();
    }, 60000);
    timer.unref();
    return { close() { clearInterval(timer); delay.disable(); } };
}
