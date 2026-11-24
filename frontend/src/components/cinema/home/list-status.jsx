import { Button } from './home-ui';
import { ListSkeleton } from '@/components/ui/list-feedback';
export default function ListStatus({ list, empty = 'Nenhum item disponível no momento.', more = 'Carregar mais', end = '', showMore = true }) {
 return <div className="my-5 space-y-3">
  {list.loading && (list.items.length?<p role="status" className="text-muted-foreground">Carregando mais itens…</p>:<ListSkeleton/>)}
  {list.error && <div role="alert" className="rounded-xl border border-border bg-card p-4"><p>{list.error}</p><Button size="sm" variant="outline" onClick={list.items.length ? list.loadMore : list.retry} className="mt-3">Tentar novamente</Button></div>}
  {!list.loading && !list.error && list.items.length === 0 && empty && <p className="text-muted-foreground">{empty}</p>}
  {showMore && list.cursor && !list.error && <Button variant="outline" disabled={list.loading} onClick={list.loadMore}>{more}</Button>}
  {end && list.loadedMore && !list.cursor && !list.loading && !list.error && <p role="status" className="text-sm text-muted-foreground">{end}</p>}
 </div>;
}
