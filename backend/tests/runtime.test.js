import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, statSync, chmodSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { runtimeConfig } from '../src/config/runtime.js';
import { createJwt } from '../src/config/jwt.js';
import { testEnvironment } from './helpers.js';

function setup(t) {
    const directory = mkdtempSync(join(tmpdir(), 'cineastra-runtime-'));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    return {
        directory,
        env: testEnvironment({ NODE_ENV: 'production', JWT_SECRET: undefined,
            JWT_SECRET_FILE: join(directory, 'auth', 'jwt-secret'),
            FRONTEND_URL: 'http://frontend.cineastra.10.189.87.231.sslip.io' })
    };
}

test('runtime gera chave privada e reutiliza tokens após nova inicialização', t => {
    const { env } = setup(t);
    const first = runtimeConfig(env);
    const token = createJwt(first.jwt).signAccess({ userId: '1', sessionId: '2' });
    const second = runtimeConfig(env);
    assert.equal(second.jwt.secret, first.jwt.secret);
    assert.equal(createJwt(second.jwt).verify(token).sub, '1');
    assert.equal(statSync(env.JWT_SECRET_FILE).mode & 0o777, 0o600);
    assert.equal(readFileSync(env.JWT_SECRET_FILE, 'utf8').trim(), first.jwt.secret);
    assert.ok(first.jwt.secret.length >= 64);
});

test('chave explícita tem precedência e não cria arquivo', t => {
    const { env } = setup(t);
    env.JWT_SECRET = randomBytes(48).toString('hex');
    assert.equal(runtimeConfig(env).jwt.secret, env.JWT_SECRET);
    assert.equal(existsSync(env.JWT_SECRET_FILE), false);
});

test('perder o arquivo gera outra chave e invalida tokens antigos', t => {
    const { env } = setup(t);
    const first = runtimeConfig(env);
    const token = createJwt(first.jwt).signAccess({ userId: '1', sessionId: '2' });
    rmSync(env.JWT_SECRET_FILE);
    const next = runtimeConfig(env);
    assert.notEqual(next.jwt.secret, first.jwt.secret);
    assert.throws(() => createJwt(next.jwt).verify(token));
});

test('configuração inválida ou múltiplas instâncias não grava chave implícita', t => {
    const { env } = setup(t);
    assert.throws(() => runtimeConfig({ ...env, DB_HOST: '' }), /DB_HOST/);
    assert.throws(() => runtimeConfig({ ...env, INSTANCE_COUNT: '2', RATE_LIMIT_STORE: 'external' }), /JWT_SECRET/);
    assert.equal(existsSync(env.JWT_SECRET_FILE), false);
    assert.throws(() => runtimeConfig({ ...env, JWT_SECRET_FILE: 'relative/secret' }), /JWT_SECRET_FILE/);
});

test('arquivo corrompido ou acessível por outros não é substituído silenciosamente', t => {
    const { env } = setup(t);
    runtimeConfig(env);
    const before = readFileSync(env.JWT_SECRET_FILE);
    chmodSync(env.JWT_SECRET_FILE, 0o644);
    assert.throws(() => runtimeConfig(env), /JWT_SECRET_FILE/);
    assert.deepEqual(readFileSync(env.JWT_SECRET_FILE), before);
    chmodSync(env.JWT_SECRET_FILE, 0o600);
    writeFileSync(env.JWT_SECRET_FILE, 'invalid');
    assert.throws(() => runtimeConfig(env), /JWT_SECRET_FILE/);
    assert.equal(readFileSync(env.JWT_SECRET_FILE, 'utf8'), 'invalid');
});

test('inicializações concorrentes publicam e reutilizam uma única chave completa', async t => {
    const { env } = setup(t);
    const moduleUrl = new URL('../src/config/runtime.js', import.meta.url).href;
    const script = `import {runtimeConfig} from ${JSON.stringify(moduleUrl)};
        import {createHash} from 'node:crypto';
        process.stdout.write(createHash('sha256').update(runtimeConfig(process.env).jwt.secret).digest('hex'));`;
    const childEnv = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== undefined));
    const digests = await Promise.all(Array.from({ length: 4 }, () => new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--input-type=module', '-e', script], { env: childEnv });
        let output = '';
        child.stdout.on('data', chunk => { output += chunk; });
        child.on('error', reject);
        child.on('close', code => code === 0 ? resolve(output) : reject(new Error('Child startup failed')));
    })));
    assert.equal(new Set(digests).size, 1);
    assert.match(digests[0], /^[a-f0-9]{64}$/);
    assert.deepEqual(readdirSync(join(env.JWT_SECRET_FILE, '..')), ['jwt-secret']);
});
