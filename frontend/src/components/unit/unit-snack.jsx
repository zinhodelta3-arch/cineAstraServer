'use client';

import { useEffect, useState } from 'react';
import { Archive, ListPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitAction, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, label } from './unit-layout';
import UnitStockOperations from './unit-stock-operations';
import styles from './unit.module.css';

export default function UnitSnack() {
  const context = useUnitContext();
  const localId = context.locations[0]?.id_local;
  const [revision, setRevision] = useState(0);
  const [stock, setStock] = useState({ inputs: [], equipment: [], loading: true, error: '' });
  const [dialog, setDialog] = useState(null);
  const [parts, setParts] = useState([]);
  const [choice, setChoice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const combos = useUnitList('/combos?limit=20', unitOperation);
  const action = useUnitAction(combos.reload, unitOperation);
  const item = dialog?.item;

  useEffect(() => {
    if (!localId) return;
    const abort = new AbortController();
    unitOperation(`/stock?localId=${localId}`, { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted) setStock({ inputs: data.inputs ?? [], equipment: data.equipment ?? [], loading: false, error: '' });
    }).catch(error => {
      if (!abort.signal.aborted) setStock({ inputs: [], equipment: [], loading: false, error: error.message });
    });
    return () => abort.abort();
  }, [localId, revision]);

  async function open(type, row = null) {
    setDialog({ type, item: row }); setParts([]); setLocalError(''); setChoice(''); setQuantity(1);
    if (type === 'composition' && row) {
      setDetailLoading(true);
      try {
        const detail = await unitOperation(`/combos/${row.id_combo}`);
        setParts(detail.items.map(part => ({ inputId: part.id_insumo, nome: part.nome, quantidade: part.quantidade })));
      } catch (error) { setLocalError(error.message); }
      finally { setDetailLoading(false); }
    }
  }
  function addPart() {
    const input = stock.inputs.find(row => row.id_insumo === choice);
    if (!input || !Number.isInteger(quantity) || quantity < 1 || parts.some(part => part.inputId === choice)) return setLocalError('Escolha um insumo ainda não adicionado e uma quantidade válida.');
    setParts(value => [...value, { inputId: choice, nome: input.nome, quantidade }]); setChoice(''); setQuantity(1); setLocalError('');
  }
  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get('preco'));
    if (!Number.isFinite(price) || price < 0 || price > 99999999.99) return setLocalError('Informe um preço válido.');
    const body = { nome: String(form.get('nome')).trim(), descricao: String(form.get('descricao')).trim() || null, preco: price.toFixed(2) };
    if (!item) {
      if (!parts.length) return setLocalError('Adicione ao menos um insumo ao combo.');
      body.localId = localId;
      body.items = parts.map(({ inputId, quantidade }) => ({ inputId, quantidade }));
    } else for (const key of Object.keys(body)) if (body[key] === item[key]) delete body[key];
    if (item && !Object.keys(body).length) return setLocalError('Nenhuma alteração para salvar.');
    if (await action.run(item ? `/combos/${item.id_combo}` : '/combos', { method: item ? 'PATCH' : 'POST', body }, item ? 'Combo atualizado.' : 'Combo criado.')) setDialog(null);
  }
  async function saveParts() {
    if (!parts.length || parts.some(part => !Number.isInteger(part.quantidade) || part.quantidade < 1)) return setLocalError('Informe uma composição válida.');
    if (await action.run(`/combos/${item.id_combo}/items`, { method: 'PUT', body: { items: parts.map(({ inputId, quantidade }) => ({ inputId, quantidade })) } }, 'Composição atualizada.')) setDialog(null);
  }
  async function archive() {
    if (await action.run(`/combos/${item.id_combo}`, { method: 'DELETE' }, 'Combo arquivado.')) setDialog(null);
  }

  return <UnitLayout title="AstraSnack da unidade" description="Acompanhe o estoque e administre os combos deste cinema." location={context.locations[0]?.nome}>
    <UnitFeedback error={context.error || stock.error || action.error || localError} notice={action.notice} />
    <div className={styles.grid}><div className={styles.card}><strong>Insumos</strong><p>{stock.loading ? 'Carregando…' : `${stock.inputs.length} itens neste cinema`}</p></div><div className={styles.card}><strong>Combos</strong><p>{combos.loading ? 'Carregando…' : `${combos.items.length} combos carregados`}</p></div><div className={styles.card}><strong>Equipamentos</strong><p>{stock.loading ? 'Carregando…' : `${stock.equipment.length} itens neste cinema`}</p></div></div>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Combos</h2><p>Ofertas e composições do AstraSnack local.</p></div><button type="button" className={styles.button} disabled={!localId || stock.loading} onClick={() => open('form')}><Plus size={16} />Novo combo</button></div><div className={styles.body}><UnitListState list={combos} empty="Nenhum combo cadastrado neste cinema." />{combos.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Combo</th><th>Insumos</th><th>Preço</th><th>Estado</th><th>Ações</th></tr></thead><tbody>{combos.items.map(row => <tr key={row.id_combo}><th scope="row">{row.nome}</th><td>{row.itemCount}</td><td>R$ {Number(row.preco).toFixed(2).replace('.', ',')}</td><td><span className={styles.badge}>{row.ativo ? 'Ativo' : 'Arquivado'}</span></td><td><div className={styles.actionRow}><button type="button" className={styles.iconButton} disabled={!row.ativo} title="Editar combo" aria-label={`Editar ${row.nome}`} onClick={() => open('form', row)}><Pencil size={16} /></button><button type="button" className={styles.iconButton} disabled={!row.ativo} title="Composição" aria-label={`Composição de ${row.nome}`} onClick={() => open('composition', row)}><ListPlus size={16} /></button><button type="button" className={styles.iconButton} disabled={!row.ativo} title="Arquivar" aria-label={`Arquivar ${row.nome}`} onClick={() => open('archive', row)}><Archive size={16} /></button></div></td></tr>)}</tbody></table></div>}<UnitMore list={combos} /></div></section>
    <section className={`${styles.panel} ${styles.ticket}`}><div className={styles.panelHeader}><div><h2>Estoque local</h2><p>Saldos disponíveis para atendimento e composição.</p></div><button type="button" className={styles.secondary} disabled={!localId} onClick={() => setRevision(value => value + 1)}>Atualizar</button></div><div className={styles.body}>{stock.loading && <p className={styles.empty}>Carregando estoque…</p>}{!stock.loading && !stock.inputs.length && <p className={styles.empty}>Nenhum insumo neste cinema.</p>}{stock.inputs.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Insumo</th><th>Em mãos</th><th>Disponível</th><th>Estado</th></tr></thead><tbody>{stock.inputs.map(row => <tr key={row.id_insumo}><th scope="row">{row.nome}</th><td>{row.quantidade}</td><td>{row.disponivel}</td><td><span className={styles.badge}>{label(row.status)}</span></td></tr>)}</tbody></table></div>}</div></section>
    <UnitStockOperations localId={localId} inputs={stock.inputs} reloadStock={() => setRevision(value => value + 1)} />
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value && !action.pending) setDialog(null); }}><DialogContent className={styles.dialog}><DialogTitle>{dialog?.type === 'archive' ? 'Arquivar combo' : dialog?.type === 'composition' ? `Composição · ${item?.nome}` : item ? 'Editar combo' : 'Novo combo'}</DialogTitle><DialogDescription>{context.locations[0]?.nome}. A composição deve usar insumos deste cinema.</DialogDescription>
      {dialog?.type === 'form' && <form key={item?.id_combo ?? 'new'} className={styles.form} onSubmit={save}><label className={styles.full}>Nome<input name="nome" required maxLength={150} defaultValue={item?.nome ?? ''} /></label><label className={styles.full}>Descrição<textarea name="descricao" maxLength={10000} defaultValue={item?.descricao ?? ''} /></label><label>Preço (R$)<input name="preco" type="number" min="0" max="99999999.99" step="0.01" required defaultValue={item?.preco ?? ''} /></label>{!item && <div className={styles.full}><h3>Composição</h3><PartEditor stock={stock.inputs} parts={parts} setParts={setParts} choice={choice} setChoice={setChoice} quantity={quantity} setQuantity={setQuantity} addPart={addPart} /></div>}<div className={styles.row}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="submit" className={styles.button} disabled={action.pending}>Salvar combo</button></div></form>}
      {dialog?.type === 'composition' && <><PartEditor stock={stock.inputs} parts={parts} setParts={setParts} choice={choice} setChoice={setChoice} quantity={quantity} setQuantity={setQuantity} addPart={addPart} /><div className={styles.row}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="button" className={styles.button} disabled={action.pending || detailLoading} onClick={saveParts}>Salvar composição</button></div></>}
      {dialog?.type === 'archive' && <div className={styles.row}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="button" className={styles.button} disabled={action.pending} onClick={archive}>Arquivar</button></div>}
      {(action.error || localError) && <p className={`${styles.message} ${styles.error}`} role="alert">{action.error || localError}</p>}
    </DialogContent></Dialog>
  </UnitLayout>;
}

function PartEditor({ stock, parts, setParts, choice, setChoice, quantity, setQuantity, addPart }) {
  return <div className={styles.stack}><div className={styles.form}><label>Insumo<select value={choice} onChange={event => setChoice(event.target.value)}><option value="">Selecione</option>{stock.filter(row => !parts.some(part => part.inputId === row.id_insumo)).map(row => <option key={row.id_insumo} value={row.id_insumo}>{row.nome}</option>)}</select></label><label>Quantidade<input type="number" min="1" value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label><button type="button" className={styles.secondary} onClick={addPart}><Plus size={16} />Adicionar</button></div><ul className={styles.list}>{parts.map(part => <li key={part.inputId}><div><strong>{part.nome}</strong><small>{part.quantidade} por combo</small></div><button type="button" className={styles.iconButton} aria-label={`Remover ${part.nome}`} onClick={() => setParts(value => value.filter(row => row.inputId !== part.inputId))}><Trash2 size={16} /></button></li>)}</ul></div>;
}
