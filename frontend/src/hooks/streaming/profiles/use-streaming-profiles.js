"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_PROFILES, STREAMING_PATH } from "@/components/streaming/profiles/profile-data";
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

const endpoint = "/api/streaming/profiles";
const photoEndpoint = (id) => `${endpoint}/${id}/photo`;
const displayProfile = (item) => ({ ...item, photo: item.photoUrl ? `${endpoint}/${item.id}/photo` : "" });

async function profileRequest(path, { method = "GET", body, signal } = {}) {
  const response = await sessionFetch(path, { method, credentials: "same-origin", cache: "no-store", signal, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

async function updatePhoto(id, photo, hadPhoto) {
  if (photo.startsWith("data:image/")) {
    const blob = await (await fetch(photo)).blob();
    const form = new FormData();
    form.set("image", blob, "perfil.jpg");
    const response = await sessionFetch(photoEndpoint(id), { method: "PUT", credentials: "same-origin", body: form });
    await readSessionResponse(response);
  } else if (!photo && hadPhoto) {
    await profileRequest(photoEndpoint(id), { method: "DELETE" });
  }
}

export default function useStreamingProfiles(onSelectProfile) {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
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
  const busy = useRef(false);

  const refresh = useCallback(async (signal) => {
    const data = await profileRequest(endpoint, { signal });
    if (!Array.isArray(data?.items)) throw new Error("Resposta inválida ao carregar os perfis.");
    setProfiles(data.items.map(displayProfile));
    setActiveId(data.activeProfileId || "");
    setLoadError("");
    setReady(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal).catch((error) => { if (!controller.signal.aborted) setLoadError(error.message || "Não foi possível carregar os perfis."); });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const reload = () => {
    setLoadError("");
    refresh().catch((error) => setLoadError(error.message || "Não foi possível carregar os perfis."));
  };
  const openEditor = (profile, element) => {
    returnFocus.current = element || manageRef.current;
    setEditor(profile || "new");
  };
  const save = async (draft) => {
    if (busy.current) return "Aguarde a operação anterior.";
    if (!draft.id && profiles.length >= MAX_PROFILES) return "Você pode ter até cinco perfis.";
    busy.current = true;
    let saved;
    try {
      const body = { name: draft.name, avatar: draft.avatar, kids: draft.kids };
      saved = await profileRequest(draft.id ? `${endpoint}/${draft.id}` : endpoint, { method: draft.id ? "PATCH" : "POST", body });
      const original = profiles.find((item) => item.id === saved.id);
      await updatePhoto(saved.id, draft.photo || "", Boolean(original?.photoUrl));
      await refresh();
      setEditor(null);
      setNotice(draft.id ? "Perfil atualizado." : "Novo perfil criado.");
      return "";
    } catch (error) {
      if (saved && !draft.id) setEditor({ ...displayProfile(saved), photo: draft.photo || "", saveError: error.message });
      try { await refresh(); } catch { /* Permite tentar a operação novamente. */ }
      return error.message || "Não foi possível salvar o perfil.";
    } finally { busy.current = false; }
  };
  const remove = async () => {
    if (!deleting || profiles.length <= 1 || busy.current) return;
    busy.current = true;
    setDeleteError("");
    try {
      await profileRequest(`${endpoint}/${deleting.id}`, { method: "DELETE" });
      await refresh();
      setNotice(`O perfil ${deleting.name} foi excluído.`);
      setDeleting(null);
    } catch (error) { setDeleteError(error.message || "Não foi possível excluir o perfil."); }
    finally { busy.current = false; }
  };
  const select = async (profile, element) => {
    if (managing) return openEditor(profile, element);
    if (busy.current) return;
    busy.current = true;
    setEntering(true);
    try {
      await profileRequest(`${endpoint}/${profile.id}/select`, { method: "POST", body: {} });
      setActiveId(profile.id);
      if (onSelectProfile) await onSelectProfile(profile);
      else router.push(STREAMING_PATH);
    } catch (error) {
      setEntering(false);
      setNotice(error.message || "Não foi possível selecionar o perfil.");
    } finally { busy.current = false; }
  };
  const toggleManaging = () => setManaging((value) => !value);
  const closeEditor = () => setEditor(null);
  const dismissNotice = () => setNotice("");
  const logoFailed = () => setLogoAvailable(false);
  const requestDelete = () => { const item = editor; setEditor(null); setDeleteError(""); returnFocus.current = manageRef.current; setDeleting(item); };
  const cancelDelete = () => { const item = deleting; setDeleting(null); setEditor(item); };
  return { profiles, ready, loadError, reload, managing, editor, deleting, deleteError, notice, activeId, entering, logoAvailable, pageRef, returnFocus, manageRef, openEditor, save, remove, select, toggleManaging, closeEditor, dismissNotice, logoFailed, requestDelete, cancelDelete };
}
