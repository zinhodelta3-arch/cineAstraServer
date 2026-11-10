import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { readSessionResponse } from '../src/lib/auth/session-response.mjs';
import { networkError } from '../src/lib/api/api-errors.mjs';

// Executa o código do workspace em isolamento, sem expor helpers no bundle real,
// sem banco e sem substituir respostas de produção por dados de teste.
async function fixture(fetchSession) {
  let now = 1_000_000;
  const calls = [];
  const context = createContext({
    Date: class extends Date { static now() { return now; } },
    AbortController, AbortSignal,
  });
  const source = await readFile(new URL('../src/hooks/auth/use-session.js', import.meta.url), 'utf8');
  const module = new SourceTextModule(`${source}\nexport { readSharedSession, invalidateSession };`, { context });
  const imports = {
    react: { useEffect() {}, useRef() {}, useState() {} },
    'next/navigation': { usePathname() {} },
    './use-auth-form': { sessionRequest() {} },
    '@/lib/auth/session-response.mjs': {
      readSessionResponse,
      sessionFetch(path, options) {
        calls.push({ path, signal: options.signal });
        return fetchSession(calls.length, options);
      },
    },
    '@/lib/api/api-errors.mjs': { networkError },
  };
  await module.link(specifier => {
    assert.ok(Object.hasOwn(imports, specifier), `Import não previsto: ${specifier}`);
    const values = imports[specifier];
    return new SyntheticModule(Object.keys(values), function () {
      for (const [name, value] of Object.entries(values)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  return { calls, read: module.namespace.readSharedSession, invalidate: module.namespace.invalidateSession,
    advance(ms) { now += ms; } };
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
const response = user => Response.json({ user });

test('20 consumidores simultâneos compartilham uma única requisição de sessão', async () => {
  const gate = deferred();
  const f = await fixture(() => gate.promise);
  const requests = Array.from({ length: 20 }, () => f.read());
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].path, '/api/session/me');
  gate.resolve(response({ id: '1', name: 'Usuário de teste', role: 'CLIENTE' }));
  const results = await Promise.all(requests);
  assert.ok(results.every(result => result.user.id === '1'));
  assert.ok(results.every(result => result === results[0]));
});

test('foco e navegação reutilizam a consulta por 30 segundos e depois revalidam', async () => {
  const f = await fixture(async () => response(null));
  await f.read();
  f.advance(29_999);
  await Promise.all(Array.from({ length: 50 }, () => f.read()));
  assert.equal(f.calls.length, 1);
  f.advance(1);
  await Promise.all(Array.from({ length: 20 }, () => f.read()));
  assert.equal(f.calls.length, 2);
});

test('um evento de alteração invalida o cache apenas uma vez para todos os consumidores', async () => {
  const f = await fixture(async count => response({ id: String(count), role: 'CLIENTE' }));
  await f.read();
  const event = {};
  const updates = Array.from({ length: 20 }, () => { f.invalidate(event); return f.read(); });
  const results = await Promise.all(updates);
  assert.equal(f.calls.length, 2);
  assert.ok(results.every(result => result.user.id === '2'));
  f.invalidate({});
  await f.read();
  assert.equal(f.calls.length, 3);
});

test('resposta antiga após uma alteração não substitui a nova sessão no cache', async () => {
  const old = deferred();
  const f = await fixture(async count => count === 1 ? old.promise : response({ id: '2' }));
  const pending = f.read();
  const oldSignal = f.calls[0].signal;
  f.invalidate({});
  assert.equal(oldSignal.aborted, true);
  assert.equal((await f.read()).user.id, '2');
  // O transporte de teste ignora o abort para exercitar a chegada fora de ordem.
  old.resolve(response({ id: '1' }));
  await pending;
  assert.equal((await f.read()).user.id, '2');
  assert.equal(f.calls.length, 2);
});

test('sessão revogada não é reutilizada depois de um evento de alteração', async () => {
  const f = await fixture(async count => count === 1 ? response({ id: '1' }) : Response.json({ message: 'Sessão expirada.' }, { status: 401 }));
  await f.read();
  f.invalidate({});
  await assert.rejects(f.read(), error => error.status === 401);
  for (let i = 0; i < 10; i++) await assert.rejects(f.read(), error => error.status === 401);
  assert.equal(f.calls.length, 2);
  f.advance(30_000);
  await assert.rejects(f.read(), error => error.status === 401);
  assert.equal(f.calls.length, 3);
});

test('indisponibilidade não causa tentativas repetidas em cada retorno de foco', async () => {
  const f = await fixture(async () => Response.json({ code: 'DEPENDENCY_UNAVAILABLE' }, { status: 503 }));
  await assert.rejects(f.read(), error => error.status === 503);
  for (let i = 0; i < 20; i++) await assert.rejects(f.read(), error => error.code === 'DEPENDENCY_UNAVAILABLE');
  assert.equal(f.calls.length, 1);
  f.invalidate({});
  await assert.rejects(f.read(), error => error.status === 503);
  assert.equal(f.calls.length, 2);
});

test('timeout encerra a consulta compartilhada e produz mensagem contextualizada', async () => {
  const f = await fixture(async () => { throw new DOMException('timeout', 'TimeoutError'); });
  await assert.rejects(f.read(), error => error.code === 'REQUEST_TIMEOUT' && /demorou para responder/.test(error.message));
  await assert.rejects(f.read(), error => error.code === 'REQUEST_TIMEOUT');
  assert.equal(f.calls.length, 1);
  f.advance(30_000);
  await assert.rejects(f.read(), error => error.code === 'REQUEST_TIMEOUT');
  assert.equal(f.calls.length, 2);
});
