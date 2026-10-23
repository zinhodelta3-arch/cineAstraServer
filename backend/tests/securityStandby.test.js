import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { identityFixture, PASSWORD } from './identityFixture.js';
import { testEnvironment } from './helpers.js';
import { validateEnv } from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { unavailableIdentityProviders } from '../src/providers/identityProviders.js';

const off = { CAPTCHA_ENABLED: 'false', TWO_FACTOR_ENABLED: 'false' };
const registration = { name: 'Pessoa Teste', email: 'standby@example.invalid', cpf: '52998224725', dateOfBirth: '2000-01-01', password: PASSWORD, passwordConfirmation: PASSWORD, termsVersion: 'fixture-v1', privacyVersion: 'fixture-v1', acceptTerms: true, acceptPrivacy: true, ageProof: 'fixture-only' };
const unusedCaptcha = { async verify() { assert.fail('CAPTCHA não deve ser chamado em standby'); } };

test('CAPTCHA e 2FA ficam desligados por padrão inclusive em produção; flags são estritas', () => {
    const env = testEnvironment({ NODE_ENV: 'production', FRONTEND_URL: 'http://localhost:3000' });
    delete env.CAPTCHA_ENABLED;
    delete env.TWO_FACTOR_ENABLED;
    assert.deepEqual(validateEnv(env).security, { captchaEnabled: false, twoFactorEnabled: false });
    assert.deepEqual(validateEnv({ ...env, CAPTCHA_ENABLED: 'true', TWO_FACTOR_ENABLED: 'true' }).security, { captchaEnabled: true, twoFactorEnabled: true });
    for (const field of ['CAPTCHA_ENABLED', 'TWO_FACTOR_ENABLED']) {
        assert.throws(() => validateEnv({ ...env, [field]: 'yes' }), new RegExp(field));
    }
});

test('cadastro, login e recuperação/reset aceitam ausência de CAPTCHA em standby', async t => {
    const f = await identityFixture({ env: off, captchaProvider: unusedCaptcha });
    t.after(() => f.close());
    await request(f.app).post('/api/auth/register').send(registration).expect(201);
    await request(f.app).post('/api/auth/login').send({ email: registration.email, password: PASSWORD }).expect(200);
    await request(f.app).post('/api/auth/password/forgot').send({ email: registration.email }).expect(200);
    const changed = 'Another!Password123';
    await request(f.app).post('/api/auth/password/reset').send({ token: f.sent[0].token, password: changed, passwordConfirmation: changed }).expect(204);
    await request(f.app).post('/api/auth/login').send({ email: registration.email, password: changed }).expect(200);
    await request(f.app).post('/api/auth/login').send({ email: registration.email, password: PASSWORD }).expect(401);
});

test('standby não transforma provedor de idade indisponível em cadastro aprovado', async t => {
    const f = await identityFixture({ env: off, captchaProvider: unusedCaptcha, providers: unavailableIdentityProviders() });
    t.after(() => f.close());
    await request(f.app).post('/api/auth/register').send(registration).expect(503);
    assert.equal(f.state.users.length, 0);
});

test('ADMIN, SUPERVISOR e cliente com fator salvo entram sem desafio; fator permanece intacto', async t => {
    const f = await identityFixture({ env: off, captchaProvider: unusedCaptcha });
    t.after(() => f.close());
    for (const role of ['ADMIN', 'SUPERVISOR', 'CLIENTE']) {
        const user = await f.addUser(role);
        f.state.factors.push({ id_2fa: `factor-${user.id_usuario}`, id_usuario: user.id_usuario, ativo: true, metodo: 'APP', chave: 'preservar-sem-ler' });
        const login = await request(f.app).post('/api/auth/login').send({ email: user.email, password: PASSWORD }).expect(200);
        assert.ok(login.body.data.accessToken);
        assert.equal(login.body.data.challengeToken, undefined);
        assert.equal(f.state.challenges.length, 0);
        assert.equal(f.state.sessions.at(-1).two_factor_verified, false);
        const auth = `Bearer ${login.body.data.accessToken}`;
        await request(f.app).get('/api/users/me').set('Authorization', auth).expect(200);
        await request(f.app).get(`/api/admin/users/${user.id_usuario}`).set('Authorization', auth).expect(role === 'ADMIN' ? 200 : 403);
        await request(f.app).patch('/api/users/me').set('Authorization', auth).send({ currentPassword: 'wrong', password: 'Changed!Password123', passwordConfirmation: 'Changed!Password123' }).expect(401);
        await request(f.app).patch('/api/users/me').set('Authorization', auth).send({ currentPassword: PASSWORD, password: 'Changed!Password123', passwordConfirmation: 'Changed!Password123' }).expect(200);
        await request(f.app).get('/api/users/me').set('Authorization', auth).expect(401);
        assert.equal(f.state.factors.at(-1).chave, 'preservar-sem-ler');
        assert.equal(f.state.factors.at(-1).ativo, true);
    }
});

test('rotas e serviços de enrollment/verify/disable ficam inativos sem mutações', async t => {
    const f = await identityFixture({ env: off });
    t.after(() => f.close());
    for (const [path, method] of [['enroll', 'enroll'], ['verify', 'verify'], ['disable', 'disableFactor']]) {
        const res = await request(f.app).post(`/api/auth/2fa/${path}`).send({}).expect(404);
        assert.equal(res.body.code, 'FEATURE_DISABLED');
        await assert.rejects(f.identity[method]({}), { code: 'FEATURE_DISABLED' });
    }
    assert.equal(f.state.factors.length, 0);
    assert.equal(f.state.challenges.length, 0);
});

test('reativar flags volta a exigir CAPTCHA e 2FA; sessão ADMIN sem fator é recusada', async t => {
    const f = await identityFixture({ env: off });
    t.after(() => f.close());
    const admin = await f.addUser('ADMIN');
    const old = await f.login(admin);
    const client = await f.addUser();
    f.state.factors.push({ id_2fa: 'saved-factor', id_usuario: client.id_usuario, ativo: true, metodo: 'APP', chave: 'preservar' });
    const oldClient = await f.login(client);
    let captchaCalls = 0;
    const app = createApp({ config: { ...f.config, security: { captchaEnabled: true, twoFactorEnabled: true } }, database: f.database, logQueue: f.logQueue,
        retention: { async check() { return true; } }, identityModel: f.model, identityProviders: f.providers,
        captchaProvider: { async verify({ token }) { captchaCalls++; return token === 'approved-fixture'; } } });
    t.after(() => app.locals.close());
    const body = { email: admin.email, password: PASSWORD };
    await request(app).post('/api/auth/login').send(body).expect(422);
    await request(app).post('/api/auth/login').send({ ...body, captchaToken: 'bad' }).expect(422);
    const login = await request(app).post('/api/auth/login').send({ ...body, captchaToken: 'approved-fixture' }).expect(200);
    assert.equal(login.body.data.next, 'ENROLL_2FA');
    assert.equal(login.body.data.accessToken, undefined);
    assert.equal(captchaCalls, 2);
    await request(app).get('/api/users/me').set('Authorization', `Bearer ${old.accessToken}`).expect(403);
    await request(app).get('/api/users/me').set('Authorization', `Bearer ${oldClient.accessToken}`).expect(401);
});
