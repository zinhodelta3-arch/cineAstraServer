'use client';

import { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { unitOperation, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState } from './unit-layout';
import styles from './unit.module.css';

export default function UnitEquipmentRequest({ localId, canManage, sessionId, action }) {
  const [selected, setSelected] = useState('');
  const [sessionStatus,setSessionStatus] = useState('AGENDADA');
  const canRequest = Boolean(localId && (canManage || sessionId));
  const sources = useUnitList(canRequest ? `/sources?kind=equipment&limit=20&localId=${localId}` : null, unitOperation);
  const sessionsPath = canManage && localId ? `/sessions?limit=20&localId=${localId}` : null;
  const sessionOptions = useUnitList(sessionsPath ? `${sessionsPath}&status=${sessionStatus}` : null, unitOperation);
  const sessions = sessionOptions.items;
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
    }, canManage ? 'Solicitação de equipamento enviada ao fornecedor.' : 'Solicitação de equipamento enviada para avaliação do supervisor.')) {
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
          {sources.nextCursor && <button type="button" className={styles.secondary} disabled={sources.loadingMore || action.pending} onClick={sources.loadMore}>Mais equipamentos</button>}
          {canManage ? <>
          <label>Situação da sessão<select value={sessionStatus} disabled={action.pending} onChange={event=>setSessionStatus(event.target.value)}>
            <option value="AGENDADA">Agendada</option><option value="EM_CARTAZ">Em cartaz</option>
          </select></label>
          <label>Sessão
            <select key={sessionStatus} name="sessionId" required defaultValue="" disabled={action.pending || sessionOptions.loading}>
              <option value="">Selecione</option>
              {sessions.map(item => <option key={item.id_sessao} value={item.id_sessao}>
                {item.titulo_filme || `Sessão #${item.id_sessao}`} · {item.data.split('-').reverse().join('/')} às {item.horario_inicio.slice(0, 5)}
              </option>)}
            </select>
          </label>
          {sessionOptions.nextCursor && <button type="button" className={styles.secondary} disabled={sessionOptions.loadingMore || action.pending} onClick={sessionOptions.loadMore}>Mais sessões</button>}
          </> : <p className={styles.full}>Sessão da equipe #{sessionId}</p>}
          <label className={styles.full}>Observação<input name="note" maxLength={2000} placeholder="Opcional" disabled={action.pending} /></label>
          <button type="submit" className={styles.button} disabled={action.pending || !equipment || (canManage && !sessions.length)}>
            {action.pending ? 'Aguarde…' : 'Solicitar equipamento'}
          </button>
        </form>
        <UnitFeedback error={action.error} notice={action.notice} />
        <UnitListState list={sources} empty="Não há equipamentos disponíveis para transferência." />
        {canManage && <UnitListState list={sessionOptions} empty="Nenhuma sessão com essa situação." />}
      </> : <p className={styles.empty}>{localId ? 'É preciso ter uma sessão vinculada à sua equipe.' : 'Aguardando o vínculo com a unidade.'}</p>}
    </div>
  </section>;
}
