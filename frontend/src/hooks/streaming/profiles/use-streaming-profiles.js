"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIVE_PROFILE_KEY, DEFAULT_PROFILES, MAX_PROFILES, PROFILE_STORAGE_KEY, STREAMING_PATH, parseProfiles } from "@/components/streaming/profiles/profile-data";

export default function useStreamingProfiles(onSelectProfile) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [ready, setReady] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeId, setActiveId] = useState("");
  const [entering, setEntering] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const pageRef = useRef(null);
  const returnFocus = useRef(null);
  const manageRef = useRef(null);
  // Hydrate browser-only storage after SSR; keep the initial server/client render identical.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      const current = raw ? parseProfiles(raw) : DEFAULT_PROFILES;
      setProfiles(current);
      const id = localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
      setActiveId(current.some((p) => p.id === id) ? id : "");
    } catch { setNotice("Não foi possível recuperar os perfis salvos. Os perfis de exemplo estão disponíveis."); }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  // A gravação só acontece em uma ação explícita, nunca na primeira renderização.
  const persist = (next) => {
    try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next)); }
    catch { return "Não foi possível salvar. Verifique o armazenamento do navegador e tente uma foto menor."; }
    setProfiles(next);
    return "";
  };
  const openEditor = (profile, element) => {
    returnFocus.current = element || manageRef.current;
    setEditor(profile || "new");
  };
  const save = (draft) => {
    if (!draft.id && profiles.length >= MAX_PROFILES) return "Você pode ter até cinco perfis.";
    const item = { ...draft, id: draft.id || globalThis.crypto?.randomUUID?.() || `perfil-${Date.now()}` };
    const next = draft.id ? profiles.map((p) => p.id === draft.id ? item : p) : [...profiles, item];
    const error = persist(next);
    if (error) return error;
    setNotice(draft.id ? "Perfil atualizado. Ficou a sua cara!" : "Novo perfil criado. A próxima história é sua.");
    setEditor(null);
    return "";
  };
  const remove = () => {
    if (!deleting || profiles.length <= 1) return;
    // Limpa a seleção antes de remover um perfil que estava ativo.
    if (deleting.id === activeId) {
      try { localStorage.removeItem(ACTIVE_PROFILE_KEY); }
      catch { setDeleteError("Não foi possível atualizar o perfil ativo. Tente novamente."); return; }
      setActiveId("");
    }
    const error = persist(profiles.filter((p) => p.id !== deleting.id));
    if (error) return setDeleteError(error);
    setNotice(`O perfil ${deleting.name} foi excluído.`);
    setDeleting(null);
  };
  const select = (profile, element) => {
    if (managing) return openEditor(profile, element);
    try {
      // Também materializa os exemplos, para a home conseguir recuperar o perfil pelo ID.
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    } catch { setNotice("Não foi possível selecionar o perfil. Verifique o armazenamento do navegador."); return; }
    setActiveId(profile.id);
    if (onSelectProfile) return onSelectProfile(profile);
    setEntering(true);
    router.push(STREAMING_PATH);
  };
  const toggleManaging = () => setManaging((v) => !v);
  const closeEditor = () => setEditor(null);
  const dismissNotice = () => setNotice("");
  const logoFailed = () => setLogoAvailable(false);
  const requestDelete = () => { const item = editor; setEditor(null); setDeleteError(""); returnFocus.current = manageRef.current; setDeleting(item); };
  const cancelDelete = () => { const item = deleting; setDeleting(null); setEditor(item); };
  return { profiles, ready, managing, editor, deleting, deleteError, notice, activeId, entering, logoAvailable, pageRef, returnFocus, manageRef, openEditor, save, remove, select, toggleManaging, closeEditor, dismissNotice, logoFailed, requestDelete, cancelDelete };
}
