'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowUpRight, Newspaper, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { publicGet } from '@/lib/api/public-api.mjs';
import { articlePath, newsCategories, newsParagraphs } from '@/lib/content/cineastra-news.mjs';
import { copyText } from '@/lib/copy-text.mjs';
import ticket from '@/components/cinema/ticket.module.css';

const editionDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' });
const articleDate = article => editionDate.format(new Date(article.publishedAt));
const readHash = () => window.location.hash.match(/^#materia-n-([1-9]\d{0,9})$/)?.[1] ?? '';
const listenHash = notify => {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
};

export default function NewsPage() {
  const id = useSyncExternalStore(listenHash, readHash, () => '');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState('0');
  const [pending, setPending] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [shareNotice, setShareNotice] = useState('');
  const [request, setRequest] = useState({ cursor: '0' });
  const activeRequest = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    publicGet(`/news?limit=20&cursor=${request.cursor}${request.category ? `&category=${encodeURIComponent(request.category)}` : ''}`, { signal: controller.signal })
      .then(data => {
        setItems(current => request.cursor === '0' ? data.items : [...current, ...data.items]);
        setCursor(data.pagination.nextCursor);
      })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => {
        if (!controller.signal.aborted) { activeRequest.current = false; setPending(false); }
      });
    return () => controller.abort();
  }, [request]);

  const listed = items.find(item => item.id === id);
  useEffect(() => {
    if (!id || listed) return;
    const controller = new AbortController();
    publicGet(`/news/${id}`, { signal: controller.signal })
      .then(item => setSelected({ id, item }))
      .catch(cause => {
        if (!controller.signal.aborted) setSelected({ id, error: cause.status === 404 ? 'Esta matéria não está mais publicada.' : 'Não foi possível carregar esta matéria.' });
      });
    return () => controller.abort();
  }, [id, listed]);

  const article = listed ?? (selected?.id === id ? selected.item : null);
  const articleError = selected?.id === id ? selected.error : null;
  const headline = items.find(item => item.destaque) ?? items[0];
  const remaining = headline ? items.filter(item => item.id !== headline.id) : [];

  function load(next, selectedCategory = category) {
    if (activeRequest.current) return;
    activeRequest.current = true;
    setPending(true);
    setError('');
    setRequest({ cursor: next, category: selectedCategory });
  }
  function changeCategory(event) {
    const value = event.target.value;
    setCategory(value);
    setItems([]);
    setCursor('0');
    load('0', value);
  }
  function closeArticle() {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new Event('hashchange'));
    setSelected(null);
    setShareNotice('');
  }
  async function share() {
    try {
      await copyText(new URL(articlePath(id), window.location.origin).href);
      setShareNotice('Link copiado.');
    } catch {
      setShareNotice('Não foi possível copiar o link.');
    }
  }

  return <main className="mx-auto min-h-[80svh] w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-18">
    <header className="border-y-4 border-double border-border pb-6 pt-5">
      <h1 className={`${ticket.title} text-[clamp(2.8rem,8vw,6rem)] leading-none font-black uppercase`}>CineAstra <span className="text-primary">News</span></h1>
      <p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted-foreground">Novidades, parcerias e acontecimentos do CineAstra.</p>
    </header>
    <section className="mt-8" aria-labelledby="news-heading" aria-busy={pending}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <h2 id="news-heading" className="text-xl font-bold">Notícias</h2>
        <label className="flex items-center gap-2 text-sm font-medium">Categoria
          <select className="min-h-11 rounded-lg border border-border bg-card px-3" value={category} onChange={changeCategory} disabled={pending}>
            <option value="">Todas</option>{newsCategories.map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      {headline && <article className={`${ticket.ticket} overflow-hidden`}>
        <div className="px-6 pb-6 pt-5 sm:px-9 sm:pb-8">
          <p className="text-sm text-primary">{headline.categoria}</p>
          <h3 className={`${ticket.title} mt-2 text-3xl font-bold sm:text-5xl`}><a href={articlePath(headline.id)}>{headline.titulo}</a></h3>
          <p className="mt-4 max-w-[65ch] text-sm leading-6 text-muted-foreground">{headline.resumo}</p>
        </div>
        <div className={ticket.tear} aria-hidden="true" />
        <div className={`${ticket.stub} flex flex-wrap items-center justify-between gap-3 px-6 py-3 sm:px-9`}>
          <time dateTime={headline.publishedAt} className="text-sm text-muted-foreground">{articleDate(headline)}</time>
          <a className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-primary underline-offset-4 hover:underline" href={articlePath(headline.id)}>Ler matéria <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
      </article>}
      {remaining.length > 0 && <ul className="mt-5 divide-y divide-border border-y border-border">
        {remaining.map(item => <li key={item.id} className="py-5">
          <p className="text-xs text-muted-foreground">{item.categoria} · <time dateTime={item.publishedAt}>{articleDate(item)}</time></p>
          <a className="mt-1 inline-flex min-h-10 items-center gap-2 text-lg font-bold underline-offset-4 hover:underline" href={articlePath(item.id)}>{item.titulo}<ArrowUpRight className="shrink-0 text-primary" size={16} aria-hidden="true" /></a>
          <p className="max-w-[65ch] text-sm text-muted-foreground">{item.resumo}</p>
        </li>)}
      </ul>}
      {pending && <p className="mt-5 text-sm text-muted-foreground" role="status">Carregando notícias…</p>}
      {error && <div className="mt-5 flex flex-wrap items-center gap-3" role="alert"><p>{error}</p><Button type="button" variant="outline" onClick={() => load(request.cursor)}>Tentar novamente</Button></div>}
      {!pending && !error && !items.length && <p className="mt-5 text-sm text-muted-foreground">Nenhuma notícia publicada nesta seleção.</p>}
      {cursor && !pending && !error && <Button type="button" className="mt-5" variant="outline" onClick={() => load(cursor)}>Ver notícias anteriores</Button>}
    </section>
    <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Newspaper size={17} aria-hidden="true" /> O envio de novidades por e-mail está desativado. As publicações ficam disponíveis neste mural.</p>
    <Dialog open={Boolean(id)} onOpenChange={open => { if (!open) closeArticle(); }}>
      <DialogContent className={`${ticket.ticket} max-h-[85dvh] overflow-y-auto sm:max-w-3xl`}>
        <DialogTitle className={`${ticket.title} pr-8 pt-2 text-2xl`}>{article?.titulo ?? 'Matéria do CineAstraNews'}</DialogTitle>
        <DialogDescription>{article ? `${article.categoria} · ${articleDate(article)}` : articleError ?? 'Carregando matéria…'}</DialogDescription>
        {article && <><div className={ticket.tear} aria-hidden="true" /><div className="space-y-4 whitespace-pre-line text-sm leading-7">
          {newsParagraphs(article.corpo).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div><div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" onClick={share}><Share2 size={16} aria-hidden="true" />Copiar link</Button><span role="status" className="text-sm text-muted-foreground">{shareNotice}</span></div></>}
      </DialogContent>
    </Dialog>
  </main>;
}
