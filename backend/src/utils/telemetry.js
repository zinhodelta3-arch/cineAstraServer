// Lista positiva: nunca aceite message/stack/sql/URL/headers/body do erro.
const errorCodes = new Set([
    'ECONNREFUSED','ECONNRESET','ETIMEDOUT','EADDRINUSE','EACCES','EPERM','ENOENT','ENOSPC','EMFILE','ENFILE',
    'ENOTFOUND','EAI_AGAIN','EPIPE','ENOMEM','ABORT_ERR','ERR_SERVER_NOT_RUNNING',
    'ER_ACCESS_DENIED_ERROR','ER_BAD_DB_ERROR','ER_BAD_FIELD_ERROR','ER_NO_SUCH_TABLE',
    'ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT','ER_CON_COUNT_ERROR','ER_TOO_MANY_USER_CONNECTIONS',
    'PROTOCOL_CONNECTION_LOST','INTERNAL_ERROR','DEPENDENCY_UNAVAILABLE'
]);
const errorTypes = new Set(['Error','TypeError','ReferenceError','RangeError','SyntaxError','ApiError','EnvironmentValidationError']);
function errorDetails(error) {
    if (error == null) return {};
    try {
        return { errorType: errorTypes.has(error.name) ? error.name : 'Error', errorCode: errorCodes.has(error.code) ? error.code : 'UNCLASSIFIED' };
    } catch { return { errorType: 'Error', errorCode: 'UNCLASSIFIED' }; }
}
export function report(event, { requestId, status, count, error, reason, exitCode, fields } = {}) {
    const safeReason = ['SIGINT','SIGTERM','uncaughtException','unhandledRejection'].includes(reason) ? reason : null;
    const safeFields = Array.isArray(fields) ? fields.filter(field => typeof field === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(field)).slice(0, 100) : null;
    console.error(JSON.stringify({ event, timestamp: new Date().toISOString(), pid: process.pid,
        ...(requestId && { requestId }), ...(Number.isInteger(status) && { status }), ...(count !== undefined && { count }),
        ...errorDetails(error), ...(safeReason && { reason: safeReason }),
        ...(Number.isInteger(exitCode) && { exitCode }), ...(safeFields && { fields: safeFields }) }));
}
