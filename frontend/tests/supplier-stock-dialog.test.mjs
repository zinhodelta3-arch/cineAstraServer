import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { loadBindings, transform } = require('next/dist/build/swc');
await loadBindings();
const source = await readFile(new URL('../src/components/supplier/supplier-stock.jsx', import.meta.url), 'utf8');
const { code } = await transform(source, {
  filename: 'supplier-stock.jsx',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic', pragma: '__jsx', pragmaFrag: '__fragment' } } },
  module: { type: 'commonjs' },
});

// Exercita o componente real com dados isolados, sem conta, banco ou movimentação.
function fixture() {
  const states = [], effects = [], pendingEffects = [], requests = [];
  let stateIndex = 0, effectIndex = 0;
  const wrapper = ({ children }) => React.createElement('div', null, children);
  function Dialog({ children }) { return React.createElement('div', null, children); }
  const rows = {
    inputs: { id_insumo: '1', nome: 'Insumo de teste', id_local: '1', quantidade: 10 },
    equipment: { id_equipamento: '2', nome: 'Equipamento de teste', id_local: '1', quantidade: 10 },
  };
  const modules = {
    react: {
      useState(initial) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = value; }];
      },
      useEffect(callback, dependencies) {
        const index = effectIndex++;
        const previous = effects[index];
        if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
          pendingEffects.push(() => {
            previous?.cleanup?.();
            effects[index] = { dependencies, cleanup: callback() };
          });
        }
      },
    },
    'lucide-react': { ArrowLeftRight: () => null, Gauge: () => null },
    '@/components/ui/dialog': { Dialog, DialogContent: wrapper, DialogDescription: wrapper, DialogTitle: wrapper },
    '@/hooks/supplier/use-supplier-data': {
      useSupplierLocations: () => ({ items: [], name: () => 'Cinema de teste' }),
      useSupplierList: path => ({ items: rows[path?.split('?')[0]] ? [rows[path.split('?')[0]]] : [], reload() {} }),
      useSupplierAction: () => ({ pending: false, setError() {} }),
      supplierRequest(path, options) {
        requests.push({ path, ...options });
        return Promise.resolve({ quantidade: 10, quantidade_reservada: 0, disponivel: 10 });
      },
    },
    './supplier-layout': { default: wrapper, dateTime: String, More: () => null, SupplierState: () => null, statusName: String },
    '@/components/admin/catalog/catalog.module.css': { default: {} },
  };
  const componentModule = { exports: {} };
  runInNewContext(code, {
    module: componentModule, exports: componentModule.exports, AbortController, __jsx: React.createElement, __fragment: React.Fragment,
    require(specifier) {
      assert.ok(Object.hasOwn(modules, specifier), `Import não previsto: ${specifier}`);
      return { __esModule: true, ...modules[specifier] };
    },
  });
  function render() {
    stateIndex = 0; effectIndex = 0;
    const tree = componentModule.exports.default();
    const html = renderToStaticMarkup(tree);
    for (const effect of pendingEffects.splice(0)) effect();
    return { tree, html };
  }
  function find(tree, predicate) {
    if (!React.isValidElement(tree)) return null;
    if (predicate(tree)) return tree;
    for (const child of React.Children.toArray(tree.props.children)) {
      const found = find(child, predicate);
      if (found) return found;
    }
    return null;
  }
  return { render, find, Dialog, rows, requests };
}

for (const kind of ['inputs', 'equipment']) {
  for (const mode of ['balance', 'move']) {
    for (const close of ['footer', 'onOpenChange']) {
      test(`${kind}: fechar ${mode} por ${close} após carregar saldo permite reabrir`, async () => {
        const f = fixture();
        let view = f.render();
        const actionLabel = `${mode === 'balance' ? 'Ver saldo de' : 'Movimentar'} ${f.rows[kind].nome}`;
        f.find(view.tree, node => node.props['aria-label'] === actionLabel).props.onClick();
        f.render();
        await Promise.resolve();
        view = f.render();
        assert.match(view.html, /Disponível/);
        assert.equal(f.requests.length, 1);
        if (close === 'onOpenChange') f.find(view.tree, node => node.type === f.Dialog).props.onOpenChange(false);
        else f.find(view.tree, node => node.type === 'button' && node.props.children === (mode === 'balance' ? 'Fechar' : 'Cancelar')).props.onClick();
        view = f.render();
        assert.equal(f.find(view.tree, node => node.type === f.Dialog).props.open, false);
        assert.equal(f.requests[0].signal.aborted, true);
        assert.equal(f.requests.length, 1, 'fechar não envia requisições');
        f.find(view.tree, node => node.props['aria-label'] === actionLabel).props.onClick();
        f.render();
        await Promise.resolve();
        view = f.render();
        assert.equal(f.find(view.tree, node => node.type === f.Dialog).props.open, true);
        assert.match(view.html, /Disponível/);
        assert.equal(f.requests.length, 2);
      });
    }
  }
}
