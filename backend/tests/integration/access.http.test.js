import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const enabled = process.env.RUN_ACCESS_HTTP_TESTS === 'true';
const roles = ['ADMIN', 'FORNECEDOR', 'SUPERVISOR', 'COLABORADOR', 'CLIENTE'];

function credentials(text) {
    const accounts = Object.fromEntries(roles.map(role => [role, []]));
    const lines = text.split(/\r?\n/);
    let role;
    for (let i = 0; i < lines.length; i++) {
        if (!/@|senha/i.test(lines[i])) {
            const heading = lines[i].match(/ADMINISTR|FORNECED|SUPERVIS|COLABOR|CLIENT/i)?.[0]?.toUpperCase();
            if (heading) role = roles.find(value => value.startsWith(heading.slice(0, 5)));
        }
        const email = lines[i].match(/E-?mail\s*:\s*(.+)/i)?.[1]?.trim();
        const password = lines[i + 1]?.match(/Senha\s*:\s*(.+)/i)?.[1]?.trim();
        if (role && email && password) accounts[role].push({ email, password });
    }
    return accounts;
}

test('HTTP real: perfis, titulares, fornecedores, equipes e unidades permanecem isolados', {
    skip: !enabled && 'Requer API local, logins de teste e confirmação explícita do ambiente isolado.',
    timeout: 300000,
}, async t => {
    assert.equal(process.env.ACCESS_HTTP_CONFIRMED_NON_PRODUCTION, 'true');
    assert.match(process.env.ACCESS_HTTP_DATABASE ?? '', /^[a-zA-Z0-9_]+_test$/);
    const base = new URL(process.env.ACCESS_HTTP_API_URL ?? 'http://127.0.0.1:8080/api');
    assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname), 'Somente API local autorizada');
    const accounts = credentials(await readFile(new URL('../../../logins.txt', import.meta.url), 'utf8'));
    const sessions = [], cache = new Map();
    let checks = 0;
    async function call(session, path, expected, { method = 'GET', body } = {}) {
        // Respeita o limite geral existente, inclusive ao testar respostas negadas.
        await delay(650);
        const options = {
            method, signal: AbortSignal.timeout(15000), redirect: 'error',
            headers: { ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
            ...(body ? { body: JSON.stringify(body) } : {}),
        };
        let response = await fetch(`${base.href}${path}`, options);
        if (response.status === 429) {
            const seconds = Number(response.headers.get('Retry-After'));
            assert.ok(Number.isFinite(seconds) && seconds > 0 && seconds <= 60, 'Rate limit deve informar prazo limitado');
            await response.arrayBuffer();
            t.diagnostic(`Limite de requisições respeitado: aguardando ${seconds}s.`);
            await delay(seconds * 1000);
            response = await fetch(`${base.href}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
        }
        const payload = response.status === 204 ? null : await response.json();
        checks++;
        assert.ok([].concat(expected).includes(response.status), `${session?.role ?? 'ANONIMO'} ${method} ${path}: esperado ${expected}; recebido ${response.status}`);
        if (response.ok && method === 'GET') cache.set(`${session?.id}:${path}`, payload?.data);
        if (!response.ok) {
            assert.equal(payload?.success, false);
            assert.equal(payload?.data, undefined, 'Resposta negada não contém dados do recurso');
        }
        if (checks % 25 === 0) t.diagnostic(`${checks} verificações HTTP concluídas`);
        return payload?.data;
    }
    async function login(role, index = 0) {
        const list = accounts[role];
        const account = index === -1 ? list.at(-1) : list[index];
        assert.ok(account, `Conta de teste disponível para ${role}`);
        const data = await call(null, '/auth/login', 200, { method: 'POST', body: account });
        assert.ok(data?.accessToken, 'Login normal deve emitir sessão');
        const session = { role, token: data.accessToken };
        const user = await call(session, '/users/me', 200);
        assert.equal(user.role, role);
        session.id = user.id; sessions.push(session);
        return session;
    }
    const saved = (session, path) => cache.get(`${session.id}:${path}`);
    const first = (value, label) => {
        const row = (Array.isArray(value) ? value : value?.items)?.[0];
        assert.ok(row, `Dados de exemplo necessários: ${label}`);
        return row;
    };
    try {
        const primary = {};
        for (const role of roles) primary[role] = await login(role);
        const matrix = [
            ['/users/me', roles],
            ['/admin/suppliers', ['ADMIN']],
            ['/admin/plans', ['ADMIN']],
            ['/suppliers/me', ['FORNECEDOR']],
            ['/inputs', ['ADMIN', 'FORNECEDOR']],
            ['/equipment', ['ADMIN', 'FORNECEDOR']],
            ['/teams', ['ADMIN', 'SUPERVISOR', 'COLABORADOR']],
            ['/teams/context', ['SUPERVISOR', 'COLABORADOR']],
            ['/orders', ['CLIENTE']],
            ['/users/me/payment-methods', ['CLIENTE']],
            ['/support', ['CLIENTE']],
            ['/streaming/profiles', ['CLIENTE']],
            ['/subscriptions/me', ['CLIENTE']],
            ['/notifications/me', roles],
        ];
        await t.test('matriz de leitura por perfil e acesso anônimo', async () => {
            for (const [path, allowed] of matrix) {
                await call(null, path, 401);
                for (const role of roles) await call(primary[role], path, allowed.includes(role) ? 200 : 403);
            }
        });
        await t.test('escritas administrativas rejeitam todos os outros perfis', async () => {
            for (const role of roles.filter(value => value !== 'ADMIN')) {
                await call(primary[role], '/admin/suppliers', 403, { method: 'POST', body: {} });
                await call(primary[role], `/admin/users/${primary.ADMIN.id}/access`, 403, { method: 'PATCH', body: {} });
                await call(primary[role], '/films/4294967295', 403, { method: 'DELETE' });
            }
        });
        const otherSupplier = await login('FORNECEDOR', 1);
        await t.test('fornecedor não consulta nem altera produto de outro fornecedor', async () => {
            const input = first(saved(primary.FORNECEDOR, '/inputs'), 'insumo');
            const id = input.id_insumo;
            await call(primary.FORNECEDOR, `/inputs/${id}`, 200);
            await call(otherSupplier, `/inputs/${id}`, 403);
            await call(otherSupplier, `/inventory/inputs/${id}`, 403);
            await call(otherSupplier, `/inputs/${id}`, 403, { method: 'PATCH', body: { nome: input.nome } });
            await call(otherSupplier, `/inputs?supplierId=${input.id_fornecedor}`, 403);
            const after = await call(primary.FORNECEDOR, `/inputs/${id}`, 200);
            assert.deepEqual(after, input);
        });
        const otherSupervisor = await login('SUPERVISOR', 1);
        const otherContext = await call(otherSupervisor, '/teams/context', 200);
        await t.test('supervisor e colaborador não atravessam os limites de unidade', async () => {
            const local = first(saved(primary.SUPERVISOR, '/teams/context')?.locations, 'unidade do supervisor');
            const foreign = first(otherContext.locations, 'outra unidade');
            assert.notEqual(local.id_local, foreign.id_local);
            await call(primary.SUPERVISOR, `/unit/locations/${local.id_local}/rooms`, 200);
            const foreignRooms = await call(otherSupervisor, `/unit/locations/${foreign.id_local}/rooms`, 200);
            const room = first(foreignRooms, 'sala da outra unidade');
            await call(primary.SUPERVISOR, `/unit/locations/${foreign.id_local}/rooms`, 403);
            await call(primary.SUPERVISOR, `/unit/locations/${foreign.id_local}/rooms/${room.id_sala}`, 403, { method: 'PATCH', body: { nome: room.nome } });
            const collaboratorLocals = saved(primary.COLABORADOR, '/teams/context').locations;
            const outside = [local, foreign].find(value => !collaboratorLocals.some(item => item.id_local === value.id_local));
            assert.ok(outside, 'Unidade fora do escopo do colaborador');
            await call(primary.COLABORADOR, `/unit/locations/${outside.id_local}/rooms`, 403);
            await call(primary.COLABORADOR, `/inventory/alerts?localId=${outside.id_local}`, 403);
        });
        await t.test('equipes e chamados rejeitam outro supervisor e colaborador não membro', async () => {
            const team = first(saved(primary.SUPERVISOR, '/teams'), 'equipe do supervisor');
            await call(primary.SUPERVISOR, `/teams/${team.id_equipe}`, 200);
            await call(otherSupervisor, `/teams/${team.id_equipe}`, 403);
            await call(otherSupervisor, `/teams/${team.id_equipe}/members`, 403);
            await call(otherSupervisor, `/teams/${team.id_equipe}/chamados`, 403);
            const outsider = await login('COLABORADOR', -1);
            await call(outsider, `/teams/${team.id_equipe}/members`, 403);
            await call(outsider, `/teams/${team.id_equipe}/chamados`, 403);
        });
        const otherClient = await login('CLIENTE', -1);
        await t.test('cliente não lê recursos privados de outro titular', async () => {
            const customer = primary.CLIENTE;
            const order = first(saved(customer, '/orders'), 'pedido do cliente');
            const profile = first(saved(customer, '/streaming/profiles'), 'perfil de streaming');
            const method = first(saved(customer, '/users/me/payment-methods'), 'método de pagamento');
            const support = first(saved(customer, '/support'), 'suporte do cliente');
            await call(customer, `/orders/${order.orderId}`, 200);
            await call(otherClient, `/orders/${order.orderId}`, 404);
            await call(otherClient, `/orders/${order.orderId}/tickets`, 404);
            await call(otherClient, `/orders/${order.orderId}/receipt`, 404);
            await call(otherClient, `/streaming/profiles/${profile.id}`, 404);
            await call(otherClient, `/streaming/profiles/${profile.id}`, 404, { method: 'PATCH', body: { name: profile.name } });
            await call(otherClient, `/users/me/payment-methods/${method.id}`, 404);
            await call(otherClient, `/support/${support.id}`, 404);
            await call(otherClient, `/support/${support.id}/messages`, 404);
        });
        await t.test('logout revoga a sessão e bloqueia reutilização do token', async () => {
            const session = sessions.pop();
            await call(session, '/auth/logout', 204, { method: 'POST' });
            await call(session, '/users/me', 401);
        });
    } finally {
        for (const session of sessions) await call(session, '/auth/logout', 204, { method: 'POST' });
        t.diagnostic(`Total: ${checks} verificações HTTP; nenhum token ou senha incluído no relatório.`);
    }
});

test('Front-end real: páginas e proxies restringem cada área ao perfil autorizado', {
    skip: !enabled && 'Requer frontend local e contas de teste autorizadas.',
    timeout: 120000,
}, async t => {
    assert.equal(process.env.ACCESS_HTTP_CONFIRMED_NON_PRODUCTION, 'true');
    assert.match(process.env.ACCESS_HTTP_DATABASE ?? '', /^[a-zA-Z0-9_]+_test$/);
    const origin = new URL(process.env.ACCESS_HTTP_WEB_URL ?? 'http://127.0.0.1:3000');
    assert.ok(['127.0.0.1', 'localhost'].includes(origin.hostname));
    const accounts = credentials(await readFile(new URL('../../../logins.txt', import.meta.url), 'utf8'));
    const destinations = { ADMIN: '/admin/dashboard', FORNECEDOR: '/fornecedor', SUPERVISOR: '/unidade', COLABORADOR: '/unidade', CLIENTE: '/cinema/home' };
    const areas = [['/admin/dashboard', ['ADMIN']], ['/fornecedor/estoque', ['FORNECEDOR']], ['/unidade', ['SUPERVISOR', 'COLABORADOR']]];
    const proxies = [
        ['/api/admin/catalog/films', ['ADMIN']],
        ['/api/fornecedor/inputs', ['FORNECEDOR']],
        ['/api/unidade/teams', ['SUPERVISOR', 'COLABORADOR']],
        ['/api/streaming/profiles', ['CLIENTE']],
    ];
    let checks = 0;
    async function web(path, cookie, { method = 'GET', body } = {}) {
        await delay(650);
        checks++;
        return fetch(new URL(path, origin), {
            method, redirect: 'manual', signal: AbortSignal.timeout(15000),
            headers: { Origin: origin.origin, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
    }
    for (const [path] of areas) {
        const response = await web(path);
        assert.equal(response.status, 307);
        assert.equal(new URL(response.headers.get('Location'), origin).pathname, '/auth/login');
        await response.arrayBuffer();
    }
    for (const [path] of proxies) {
        const response = await web(path);
        assert.equal(response.status, 401);
        await response.arrayBuffer();
    }
    for (const role of roles) {
        const login = await web('/api/session/login', null, { method: 'POST', body: accounts[role][0] });
        assert.equal(login.status, 200, `Login frontend de ${role}`);
        assert.equal((await login.json()).user.role, role);
        const cookie = login.headers.get('Set-Cookie')?.split(';')[0];
        assert.ok(cookie, 'Sessão emitida pelo frontend');
        try {
            for (const [path, allowed] of areas) {
                const response = await web(path, cookie);
                assert.equal(response.status, allowed.includes(role) ? 200 : 307, `${role} ${path}`);
                if (!allowed.includes(role)) assert.equal(new URL(response.headers.get('Location'), origin).pathname, destinations[role]);
                await response.arrayBuffer();
            }
            for (const [path, allowed] of proxies) {
                const response = await web(path, cookie);
                assert.equal(response.status, allowed.includes(role) ? 200 : 403, `${role} ${path}`);
                await response.arrayBuffer();
            }
        } finally {
            const response = await web('/api/session/logout', cookie, { method: 'POST' });
            assert.equal(response.status, 200);
            await response.arrayBuffer();
        }
    }
    t.diagnostic(`Total: ${checks} verificações HTTP no frontend.`);
});
