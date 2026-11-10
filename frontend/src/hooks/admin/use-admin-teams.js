'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useEffect, useRef, useState } from 'react';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function teamRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/admin/teams/${path}`, { method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body) });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export function useAdminTeams(path) {
  return usePaginatedList(path, teamRequest);
}

export function useTeamScope() {
  const teams = useAdminTeams('teams?limit=100');
  const [teamId, setTeamId] = useState('');
  const [remoteTeam, setRemoteTeam] = useState(null);
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('teamId');
    if (fromUrl && /^[1-9]\d{0,9}$/.test(fromUrl) && BigInt(fromUrl) <= 4294967295n) setTeamId(fromUrl);
  }, []);
  useEffect(() => { if (!teamId && teams.items.length) setTeamId(teams.items[0].id_equipe); }, [teamId, teams.items]);
  const listedTeam = teams.items.find(row => row.id_equipe === teamId) ?? null;
  useEffect(() => {
    if (!teamId || listedTeam) return;
    const abort = new AbortController();
    teamRequest(`teams/${teamId}`, { signal: abort.signal }).then(data => { if (!abort.signal.aborted) setRemoteTeam(data); }).catch(() => { if (!abort.signal.aborted) setRemoteTeam(null); });
    return () => abort.abort();
  }, [teamId, listedTeam]);
  function selectTeam(id) {
    setTeamId(id);
    setRemoteTeam(null);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('teamId', id); else url.searchParams.delete('teamId');
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }
  return { teams, teamId, selectTeam, team: listedTeam ?? (remoteTeam?.id_equipe === teamId ? remoteTeam : null) };
}

export function useTeamActions(list) {
  const [dialog, setDialog] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [pending, setPending] = useState(false);
  const lock = useRef(false);
  function open(type, item = null) { setError(''); setDialog({ type, item }); }
  function close() { if (!lock.current) setDialog(null); }
  async function run(task, message, after) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError('');
    try { const result = await task(); setDialog(null); setNotice(typeof message === 'function' ? message(result) : message); list.reload(); after?.(result); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  return { dialog, error, notice, pending, open, close, run, setError };
}
