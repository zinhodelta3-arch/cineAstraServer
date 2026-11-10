'use client';

import { Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import SupplyLayout, { SupplyState, statusName } from './supply-layout';
import styles from '../catalog/catalog.module.css';

const km = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export default function LogisticsRoutesAdmin() {
  const list = useAdminSupply('logistics-routes?limit=20');
  const locations = useAdminVenues('locations?limit=100');
  const actions = useSupplyActions(list);
  const item = actions.dialog?.item;
  const available = locations.items.filter(location => location.status === 'ATIVO');

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const distance = String(form.get('distance')).trim().replace(',', '.');
    const minutes = Number(form.get('minutes'));
    if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(distance) || Number(distance) <= 0 ||
      !Number.isInteger(minutes) || minutes < 1 || minutes > 10080) {
      actions.setError('Informe uma distância positiva em quilômetros e um tempo entre 1 e 10.080 minutos.');
      return;
    }
    const body = { distancia_km: distance, tempo_estimado_min: minutes };
    if (item) {
      body.status = form.get('status');
    } else {
      body.originId = form.get('origin');
      body.destinationId = form.get('destination');
      if (!body.originId || !body.destinationId || body.originId === body.destinationId) {
        actions.setError('Escolha uma origem e um destino diferentes.');
        return;
      }
    }
    actions.run(
      () => supplyRequest(item ? `logistics-routes/${item.id_rota}` : 'logistics-routes', {
        method: item ? 'PATCH' : 'POST', body,
      }),
      item ? 'Rota atualizada.' : 'Rota cadastrada.'
    );
  }

  return <SupplyLayout title="Rotas de entrega" description="Cadastre a distância e o tempo médio de viagem entre os locais."
    action={<button type="button" className={styles.primary} onClick={() => actions.open('form')}><Plus size={16} aria-hidden="true" /> Nova rota</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="logistics-routes-title">
      <header className={styles.panelHeader}><div>
        <h2 id="logistics-routes-title">Rotas cadastradas</h2>
        <p>Cada direção tem sua própria previsão. Cadastre apenas os trajetos que a operação usa.</p>
      </div></header>
      <SupplyState list={list} noun="rotas" empty="Nenhuma rota cadastrada." />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de rotas de entrega" tabIndex={0}>
        <table className={styles.table}>
          <thead><tr>
            <th scope="col">Origem</th><th scope="col">Destino</th><th scope="col">Distância</th>
            <th scope="col">Tempo médio</th><th scope="col">Status</th><th scope="col">Ações</th>
          </tr></thead>
          <tbody>{list.items.map(route => <tr key={route.id_rota}>
            <th scope="row">{route.nome_origem}</th><td>{route.nome_destino}</td>
            <td>{km.format(Number(route.distancia_km))} km</td><td>{route.tempo_estimado_min} min</td>
            <td><span className={`${styles.badge} ${route.status === 'INATIVO' ? styles.inactive : ''}`}>{statusName(route.status)}</span></td>
            <td><button type="button" className={styles.iconButton} title="Editar rota"
              aria-label={`Editar rota de ${route.nome_origem} para ${route.nome_destino}`}
              onClick={() => actions.open('form', route)}><Pencil size={16} aria-hidden="true" /></button></td>
          </tr>)}</tbody>
        </table>
      </div>}
      {list.nextCursor && <footer className={styles.footer}>
        <span>{list.items.length} rotas carregadas</span>
        <button type="button" onClick={list.loadMore} disabled={list.loadingMore}>{list.loadingMore ? 'Carregando…' : 'Carregar mais'}</button>
      </footer>}
    </section>

    <Dialog open={Boolean(actions.dialog)} onOpenChange={open => { if (!open) actions.close(); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle className={styles.dialogTitle}>{item ? 'Editar rota' : 'Nova rota'}</DialogTitle>
        <DialogDescription className={styles.dialogDescription}>
          {item ? `De ${item.nome_origem} para ${item.nome_destino}.` : 'Selecione os locais na ordem do envio.'}
        </DialogDescription>
        <form key={item?.id_rota ?? 'new'} onSubmit={save}>
          <div className={styles.form}>
            {item ? null : <>
              <label>Origem<select name="origin" required defaultValue="" disabled={actions.pending}>
                <option value="">Selecione</option>
                {available.map(location => <option key={location.id_local} value={location.id_local}>{location.nome}</option>)}
              </select></label>
              <label>Destino<select name="destination" required defaultValue="" disabled={actions.pending}>
                <option value="">Selecione</option>
                {available.map(location => <option key={location.id_local} value={location.id_local}>{location.nome}</option>)}
              </select></label>
            </>}
            <label>Distância em km<input name="distance" inputMode="decimal" required maxLength={9}
              defaultValue={item?.distancia_km?.replace('.', ',') ?? ''} disabled={actions.pending} /></label>
            <label>Tempo médio em minutos<input name="minutes" type="number" required min={1} max={10080}
              defaultValue={item?.tempo_estimado_min ?? ''} disabled={actions.pending} /></label>
            {item && <label>Status<select name="status" defaultValue={item.status} disabled={actions.pending}>
              <option value="ATIVO">Ativa</option><option value="INATIVO">Inativa</option>
            </select></label>}
          </div>
          {!item && <SupplyState list={locations} noun="locais" empty="Nenhum local encontrado." />}
          {!item && locations.nextCursor && <button type="button" className={styles.secondary}
            onClick={locations.loadMore} disabled={locations.loadingMore}>Carregar mais locais</button>}
          {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
          <div className={styles.dialogActions}>
            <button type="button" className={styles.secondary} onClick={actions.close} disabled={actions.pending}>Cancelar</button>
            <button type="submit" className={styles.primary} disabled={actions.pending || (!item && available.length < 2)}>
              {actions.pending ? 'Salvando…' : 'Salvar rota'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </SupplyLayout>;
}
