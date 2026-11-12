'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useEffect, useRef, useState } from 'react';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function unitRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/unidade/teams${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body) });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export async function unitSessions(path, { signal } = {}) {
  const response = await sessionFetch(`/api/unidade/sessions${path}`, { cache: 'no-store', credentials: 'same-origin', signal });
  return readSessionResponse(response);
}

export async function unitOperation(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/unidade/operacoes${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body) });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export function useUnitList(path, request = unitRequest) {
  return usePaginatedList(path, request);
}

export function useUnitTeam() {
  const teams = useUnitList('?limit=100');
  const [selected, setSelected] = useState('');
  const [remoteTeam, setRemoteTeam] = useState(null);
  const firstTeamId = teams.items[0]?.id_equipe;
  useEffect(() => { if (!selected && firstTeamId) setSelected(firstTeamId); }, [selected, firstTeamId]);
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('teamId');
    if (fromUrl && /^[1-9]\d{0,9}$/.test(fromUrl)) setSelected(fromUrl);
  }, []);
  const listedTeam = teams.items.find(team => team.id_equipe === selected);
  useEffect(() => {
    if (!selected || listedTeam || teams.loading) return;
    const abort = new AbortController();
    unitRequest(`/${selected}`, { signal: abort.signal }).then(data => { if (!abort.signal.aborted) setRemoteTeam(data); }).catch(() => { if (!abort.signal.aborted) setRemoteTeam(null); });
    return () => abort.abort();
  }, [selected, listedTeam, teams.loading]);
  const teamId = selected || teams.items[0]?.id_equipe || '';
  function setTeamId(id) {
    setSelected(id);
    setRemoteTeam(null);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('teamId', id); else url.searchParams.delete('teamId');
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }
  return { teams, teamId, setTeamId, team: teams.items.find(team => team.id_equipe === teamId) ?? (remoteTeam?.id_equipe === teamId ? remoteTeam : null) };
}

export function useUnitContext() {
  const [state, setState] = useState({ locations: [], loading: true, error: '' });
  useEffect(() => {
    const abort = new AbortController();
    unitRequest('/context', { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted) setState({ locations: Array.isArray(data?.locations) ? data.locations : [], loading: false, error: '' });
    }).catch(error => { if (!abort.signal.aborted) setState({ locations: [], loading: false, error: error.message }); });
    return () => abort.abort();
  }, []);
  return state;
}

export function useUnitAction(reload, request = unitRequest) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  async function run(path, options, success) {
    if (lock.current) return false;
    lock.current = true; setPending(true); setError(''); setNotice('');
    try {
      await request(path, options);
      setNotice(success);
      reload?.();
      return true;
    } catch (cause) {
      setError(cause.message);
      return false;
    } finally { lock.current = false; setPending(false); }
  }
  return { run, pending, error, notice, setError: message => { setNotice(''); setError(message); } };
}
