import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { commerceErrors } from '../src/lib/api/commerce-errors.mjs';
import { errorMessage, errorMetadata } from '../src/lib/api/api-errors.mjs';
import { resolveApiBase } from '../src/lib/api/api-base.mjs';
import { registrationErrorMessage } from '../src/lib/auth/registration-errors.mjs';
import { readSessionResponse } from '../src/lib/auth/session-response.mjs';

const source = await readFile(new URL('../src/lib/auth/server.js', import.meta.url), 'utf8');

test('proxy preserva o código de atendimento quando o prazo vence durante a leitura do corpo', async () => {
  const deadline = new AbortController();
  const requestId = randomUUID();
  const context = createContext({
    process: { env: { BACKEND_API_URL: 'http://localhost:8080/api' } },
    AbortSignal: { timeout: () => deadline.signal },
    async fetch() {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Request-Id': requestId }),
        async json() {
          deadline.abort(new DOMException('Timeout simulado', 'TimeoutError'));
          throw new DOMException('Leitura cancelada', 'AbortError');
        },
      };
    },
  });
  const imports = {
    'server-only': {},
    'node:crypto': { randomUUID },
    react: { cache: fn => fn },
    'next/headers': { cookies() { assert.fail('O proxy não deve ler cookies nesta chamada'); } },
    '@/lib/api/commerce-errors.mjs': { commerceErrors },
    './registration-errors.mjs': { registrationErrorMessage },
    '@/lib/api/api-base.mjs': { resolveApiBase },
    '@/lib/api/api-errors.mjs': { errorMetadata, errorMessage },
  };
  const module = new SourceTextModule(source, { context });
  await module.link(specifier => {
    assert.ok(Object.hasOwn(imports, specifier), `Import não previsto: ${specifier}`);
    const values = imports[specifier];
    return new SyntheticModule(Object.keys(values), function () {
      for (const [name, value] of Object.entries(values)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  await assert.rejects(module.namespace.backendAuth('/users/me'), {
    status: 503, code: 'REQUEST_TIMEOUT', requestId,
  });
});

test('cliente autenticado usa o status HTTP quando o proxy devolve HTML de erro', async () => {
  const requestId = randomUUID();
  const response = new Response('<html>Serviço indisponível</html>', {
    status: 503,
    headers: { 'Content-Type': 'text/html', 'X-Request-Id': requestId, 'Retry-After': '5' },
  });
  await assert.rejects(readSessionResponse(response), {
    status: 503, code: 'DEPENDENCY_UNAVAILABLE', requestId, retryAfter: 5,
  });
});
