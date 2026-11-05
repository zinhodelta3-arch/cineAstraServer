import { report } from '../utils/telemetry.js';

export function createLogRetention(model, config) {
    let timer;
    let stopped = false;
    let running = Promise.resolve();
    async function check(options) { return model.checkRetention(config.retentionMode, options); }
    const run = () => {
        running = (async () => {
            try {
                if (await check()) report('log_retention_completed', { count: await model.purge() });
                else report('log_retention_not_ready');
            }
            catch (error) { report('log_retention_failed', { error }); }
            finally { if (!stopped) { timer = setTimeout(run, config.purgeInterval); timer.unref(); } }
        })();
    };
    return {
        check,
        start() { if (config.retentionMode === 'worker') run(); },
        async close() { stopped = true; clearTimeout(timer); await running; }
    };
}
