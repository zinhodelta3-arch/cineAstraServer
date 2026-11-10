'use client';

import { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { unitOperation, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitListState, UnitMore } from './unit-layout';
import styles from './unit.module.css';

export default function UnitEquipmentRequest({ localId, canManage, sessionId, action }) {
  const [selected, setSelected] = useState('');
  const canRequest = Boolean(localId && (canManage || sessionId));
  const sources = useUnitList(canRequest ? `/sources?kind=equipment&limit=20&localId=${localId}` : null, unitOperation);
  const sessionsPath = canManage && localId ? `/sessions?limit=20&localId=${localId}` : null;
  const scheduled = useUnitList(sessionsPath ? `${sessionsPath}&status=AGENDADA` : null, unitOperation);
  const showing = useUnitList(sessionsPath ? `${sessionsPath}&status=EM_CARTAZ` : null, unitOperation);
  const sessions = [...showing.items, ...scheduled.items];
  const equipment = sources.items.find(item => item.id_equipamento === selected);

  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const selectedSession = canManage ? form.get('sessionId') : sessionId;
    if (!equipment || !selectedSession || (canManage && !sessions.some(item => item.id_sessao === selectedSession))) {
      action.setError('Selecione um equipamento disponível e uma sessão da unidade.');
      return;
    }
    const note = String(form.get('note') ?? '').trim();
    if (await action.run('/requests', {
      method: 'POST',
      body: { localId, sessionId: selectedSession, equipmentId: equipment.id_equipamento,
        quantity: equipment.disponivel, ...(note ? { note } : {}) },
    }, 'Solicitação de equipamento enviada ao fornecedor.')) {
      formElement.reset();
      setSelected('');
      sources.reload();
    }
  }

  return <section className={styles.panel} aria-labelledby="unit-equipment-request">
    <header className={styles.panelHeader}><div>
      <h2 id="unit-equipment-request">Solicitar equipamento</h2>
      <p>Peça um equipamento de outro cinema para uma sessão desta unidade.</p>
    </div><PackagePlus size={19} aria-hidden="true" /></header>
    <div className={styles.body}>
      {canRequest ? <>
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.full}>Equipamento na origem
            <select value={selected} onChange={event => setSelected(event.target.value)} required disabled={action.pending}>
              <option value="">Selecione</option>
              {sources.items.map(item => <option key={item.id_equipamento} value={item.id_equipamento}>
                {item.nome} · {item.nome_origem}
              </option>)}
            </select>
          </label>
          {equipment && <p className={styles.full}>Quantidade da transferência: {equipment.disponivel}. A transferência é integral.</p>}
          {canManage ? <label className={styles.full}>Sessão
            <select name="sessionId" required defaultValue="" disabled={action.pending}>
              <option value="">Selecione</option>
              {sessions.map(item => <option key={item.id_sessao} value={item.id_sessao}>
                {item.titulo_filme || `Sessão #${item.id_sessao}`} · {item.data.split('-').reverse().join('/')} às {item.horario_inicio.slice(0, 5)}
              </option>)}
            </select>
          </label> : <p className={styles.full}>Sessão da equipe #{sessionId}</p>}
          <label className={styles.full}>Observação<input name="note" maxLength={2000} placeholder="Opcional" disabled={action.pending} /></label>
          <button type="submit" className={styles.button} disabled={action.pending || !equipment || (canManage && !sessions.length)}>
            {action.pending ? 'Aguarde…' : 'Solicitar equipamento'}
          </button>
        </form>
        <UnitListState list={sources} empty="Não há equipamentos disponíveis para transferência." />
        <UnitMore list={sources} caption="Carregar mais equipamentos" />
        {canManage && <>
          {scheduled.error && <UnitListState list={scheduled} empty="" />}
          {showing.error && <UnitListState list={showing} empty="" />}
          {!sessions.length && !scheduled.error && !showing.error &&
            <p className={styles.empty}>{scheduled.loading || showing.loading ? 'Carregando sessões…' : 'Não há sessões agendadas ou em cartaz.'}</p>}
          <UnitMore list={showing} caption="Carregar mais sessões em cartaz" />
          <UnitMore list={scheduled} caption="Carregar mais sessões agendadas" />
        </>}
      </> : <p className={styles.empty}>{localId ? 'É preciso ter uma sessão vinculada à sua equipe.' : 'Aguardando o vínculo com a unidade.'}</p>}
    </div>
  </section>;
}
