import { report } from '../utils/telemetry.js';

export function createLogQueue(write, { limit = 200, reportFailure = report } = {}) {
    const queue = [];
    const metrics = { written: 0, failed: 0, dropped: 0 };
    let active = false;
    let accepting = true;
    let task = Promise.resolve();
    async function run() {
        active = true;
        try {
            while (queue.length) {
                const item = queue.shift();
                try { await write(item); metrics.written++; }
                catch (error) { metrics.failed++; reportFailure('http_log_write_failed', { count: metrics.failed, error }); }
            }
        } finally { active = false; }
    }
    return {
        enqueue(item) {
            if (!accepting || queue.length + Number(active) >= limit) {
                metrics.dropped++;
                if (metrics.dropped === 1 || metrics.dropped % 100 === 0) reportFailure('http_log_queue_full', { count: metrics.dropped });
                return false;
            }
            queue.push(item);
            if (!active) task = run();
            return true;
        },
        stats() { return { ...metrics, pending: queue.length + Number(active) }; },
        async drain() { await task; },
        async close({ timeoutMs } = {}) {
            accepting = false;
            let timer;
            const discard = () => {
                const count = queue.length;
                queue.length = 0;
                metrics.dropped += count;
                if (count) reportFailure('http_log_shutdown_dropped', { count });
            };
            if (Number.isFinite(timeoutMs)) {
                if (timeoutMs <= 0) discard();
                else timer = setTimeout(discard, timeoutMs);
            }
            // A gravação em andamento continua protegida pelo timeout do banco.
            try { await task; } finally { clearTimeout(timer); }
        }
    };
}
