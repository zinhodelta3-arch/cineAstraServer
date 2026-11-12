import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../../src/config/database.js';
import { recordAuditEvent } from '../../src/models/auditModel.js';

test('MySQL real: estoque, auditoria e outbox confirmam ou revertem juntos', {
    skip: process.env.RUN_INTEGRITY_MYSQL_TESTS !== 'true' && 'Requer confirmação explícita e banco de teste preparado.',
    timeout: 30000,
}, async t => {
    const env = process.env;
    assert.equal(env.NODE_ENV, 'test');
    assert.equal(env.INTEGRITY_TEST_CONFIRMED_NON_PRODUCTION, 'true');
    assert.match(env.DB_NAME ?? '', /^[a-zA-Z0-9_]+_test$/);
    assert.ok(['database', 'localhost', '127.0.0.1'].includes(env.DB_HOST), 'Somente MySQL local');
    const database = createDatabase({
        host: env.DB_HOST, port: Number(env.DB_PORT ?? 3306), user: env.DB_USER,
        password: env.DB_PASSWORD, database: env.DB_NAME,
        timeout: 5000, connectionLimit: 2, queueLimit: 10,
    });
    const event = () => ({
        eventId: randomUUID(), requestId: randomUUID(), type: 'TEST.INTEGRITY_TRANSACTION',
        aggregateId: '1', actorId: null, version: 1, occurredAt: new Date().toISOString(),
    });
    async function counts(eventId) {
        const [[row]] = await database.execute(`SELECT
            (SELECT COUNT(*) FROM auditoria_eventos WHERE event_id=?) AS auditCount,
            (SELECT COUNT(*) FROM outbox_eventos WHERE event_id=?) AS outboxCount`, [eventId, eventId]);
        return [Number(row.auditCount), Number(row.outboxCount)];
    }
    try {
        const [[target]] = await database.execute('SELECT DATABASE() AS name');
        assert.equal(target.name, env.DB_NAME);
        for (const phase of ['outbox', 'after-audit']) {
            await t.test(`falha em ${phase} não deixa estoque ou auditoria parcialmente gravados`, async () => {
                const audit = event();
                let original;
                await assert.rejects(database.transaction(async connection => {
                    const [[item]] = await connection.execute('SELECT id_insumo,quantidade FROM insumos ORDER BY id_insumo LIMIT 1 FOR UPDATE');
                    assert.ok(item, 'Insumo do conjunto de testes necessário');
                    original = item;
                    audit.aggregateId = String(item.id_insumo);
                    await connection.execute('UPDATE insumos SET quantidade=quantidade+1 WHERE id_insumo=?', [item.id_insumo]);
                    // Provoca uma falha real de JSON na segunda gravação da auditoria.
                    const auditConnection = phase === 'outbox' ? {
                        execute(sql, params) {
                            return connection.execute(sql, sql.startsWith('INSERT INTO outbox_eventos') ? [params[0], '{invalid-json'] : params);
                        },
                    } : connection;
                    await recordAuditEvent(auditConnection, audit);
                    throw new Error('test_failure_after_audit');
                }), phase === 'outbox' ? { code: 'ER_INVALID_JSON_TEXT' } : /test_failure_after_audit/);
                const [[after]] = await database.execute('SELECT quantidade FROM insumos WHERE id_insumo=?', [original.id_insumo]);
                assert.equal(after.quantidade, original.quantidade);
                assert.deepEqual(await counts(audit.eventId), [0, 0]);
                await database.ping();
            });
        }
        await t.test('commit mantém auditoria e outbox únicos mesmo após tentativa repetida', async () => {
            const audit = event();
            await database.transaction(connection => recordAuditEvent(connection, audit));
            assert.deepEqual(await counts(audit.eventId), [1, 1]);
            await assert.rejects(database.transaction(connection => recordAuditEvent(connection, audit)), { code: 'ER_DUP_ENTRY' });
            assert.deepEqual(await counts(audit.eventId), [1, 1]);
            const [[row]] = await database.execute('SELECT payload FROM outbox_eventos WHERE event_id=?', [audit.eventId]);
            const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
            assert.deepEqual(Object.keys(payload).sort(), ['aggregateId', 'eventId', 'type', 'version']);
        });
    } finally { await database.close(); }
});
